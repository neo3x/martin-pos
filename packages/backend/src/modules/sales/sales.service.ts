import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductsService } from '../products/products.service';
import {
  ISaleCreate,
  SaleStatus,
  StockMovementType,
  InputMethod,
  ProductStatus,
  PaymentMethod,
} from '@martin-pos/shared';
import { calculateSaleTotal } from '@martin-pos/shared';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService
  ) {}

  private readonly selfScopeRoles = ['CASHIER', 'SELLER', 'WAITER', 'STOCKER', 'KITCHEN', 'VIEWER'];

  private shouldUseSelfScope(role?: string) {
    return this.selfScopeRoles.includes(String(role || '').toUpperCase());
  }

  async create(data: ISaleCreate, userId: string, branchId: string) {
    // Generate sale number before transaction
    const lastSale = await this.prisma.sale.findFirst({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
    });
    const saleNumber = this.generateSaleNumber(lastSale?.saleNumber);

    // Get branch config for tax rate
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { moduleType: true, config: true },
    });
    const taxRate = Number((branch?.config as any)?.taxRate || 0.19);
    const branchModule = branch?.moduleType;

    if (branchModule === 'BOTILLERIA') {
      await this.assertBotilleriaSaleHours(branchId);
      const productIds = data.items.map((item) => item.productId);
      const alcoholicCount = await this.prisma.alcoholicProduct.count({
        where: {
          productId: { in: productIds },
        },
      });

      if (alcoholicCount > 0 && !data.ageVerified) {
        throw new BadRequestException('Debe validar mayoria de edad para vender productos alcoholicos');
      }
    }

    const promotion = data.promotionId
      ? await this.prisma.promotion.findFirst({
          where: {
            id: data.promotionId,
            branchId,
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          include: { comboProducts: true },
        })
      : null;

    if (data.promotionId && !promotion) {
      throw new BadRequestException('La promocion seleccionada no esta activa');
    }

    const stockInputMethod = this.normalizeInputMethod(data.inputMethod);

    // All stock validation and mutation inside a single transaction
    const { sale, paymentPlan } = await this.prisma.$transaction(async (tx) => {
      // Validate stock inside transaction to prevent race conditions
      const saleItems: any[] = [];
      let subtotal = 0;

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || product.deletedAt) {
          throw new NotFoundException(`Producto no encontrado: ${item.productId}`);
        }

        if (Number(product.stock) < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}. Stock actual: ${Number(product.stock)}, solicitado: ${item.quantity}`
          );
        }

        const itemSubtotal = item.quantity * Number(item.unitPrice);
        const itemDiscount = Number(item.discount || 0);
        const itemTax = product.taxable ? ((itemSubtotal - itemDiscount) * taxRate) : 0;
        const itemTotal = itemSubtotal - itemDiscount + itemTax;
        subtotal += itemSubtotal;

        saleItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: itemSubtotal,
          tax: itemTax,
          discount: itemDiscount,
          total: itemTotal,
          notes: item.notes,
        });
      }

      const totalUnits = data.items.reduce((sum, item) => sum + Number(item.quantity), 0);
      const autoBookstoreDiscount =
        branchModule === 'BOOKSTORE' && totalUnits >= 5 ? Math.round(subtotal * 0.05) : 0;
      const requestedDiscount = Number(data.discount || 0);
      const promotionDiscount = this.calculatePromotionDiscount(promotion as any, saleItems, subtotal);
      const effectiveDiscount = requestedDiscount + autoBookstoreDiscount + promotionDiscount;
      const totals = calculateSaleTotal(subtotal, taxRate, effectiveDiscount);

      const paymentPlan = this.resolvePayments(data, Number(totals.total));

      const saleNotes = [
        data.notes,
        autoBookstoreDiscount > 0 ? 'Descuento automatico libreria aplicado (5%)' : null,
        promotion ? `Promocion aplicada: ${promotion.name}` : null,
        data.packName ? `Pack botilleria: ${data.packName}` : null,
        data.campaignTag ? `Campana: ${data.campaignTag}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      // Create sale
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          branchId,
          userId,
          customerId: data.customerId,
          status: SaleStatus.COMPLETED,
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total,
          paymentMethod: paymentPlan.salePaymentMethod,
          notes: saleNotes || undefined,
          tableId: data.tableId,
          orderId: data.orderId,
          items: {
            create: saleItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });

      // Update stock for each item
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        const previousStock = Number(product.stock);
        const newStock = previousStock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            status: newStock === 0 ? ProductStatus.OUT_OF_STOCK : product.status,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            branchId,
            userId,
            type: StockMovementType.SALE,
            quantity: item.quantity,
            previousStock,
            newStock,
            referenceId: newSale.id,
            inputMethod: stockInputMethod,
          },
        });
      }

      return { sale: newSale, paymentPlan };
    });

    const openRegister = await this.prisma.cashRegister.findFirst({
      where: { branchId, userId, status: 'OPEN' },
      select: { id: true },
    });

    if (openRegister) {
      await this.prisma.$transaction([
        ...paymentPlan.payments.map((payment) =>
          this.prisma.cashTransaction.create({
            data: {
              cashRegisterId: openRegister.id,
              userId,
              type: 'INCOME',
              category: 'SALE',
              amount: payment.amount,
              paymentMethod: payment.paymentMethod as any,
              description: `Venta ${sale.saleNumber}`,
              saleId: sale.id,
            },
          })
        ),
        this.prisma.cashRegister.update({
          where: { id: openRegister.id },
          data: {
            totalSales: {
              increment: sale.total,
            },
          },
        }),
      ]);
    }

    this.logger.log(`Sale created: ${sale.saleNumber} total=${sale.total} by user ${userId}`);
    return sale;
  }

  async findAll(
    branchId: string,
    filters?: any,
    actor?: { userId: string; role: string },
  ) {
    const where: any = {
      branchId,
      deletedAt: null,
    };

    if (this.shouldUseSelfScope(actor?.role)) {
      where.userId = actor?.userId;
    }

    if (filters?.dateFrom && filters?.dateTo) {
      where.createdAt = {
        gte: new Date(filters.dateFrom),
        lte: new Date(filters.dateTo),
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  async findOne(
    id: string,
    branchId?: string,
    actor?: { userId: string; role: string },
  ) {
    const where: any = { id, deletedAt: null };
    if (branchId) {
      where.branchId = branchId;
    }
    if (this.shouldUseSelfScope(actor?.role)) {
      where.userId = actor?.userId;
    }

    const sale = await this.prisma.sale.findFirst({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        branch: true,
        cashTransactions: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async cancelSale(
    id: string,
    userId: string,
    branchId: string,
    actor?: { userId: string; role: string },
  ) {
    const sale = await this.findOne(id, branchId, actor);

    if (sale.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('Sale already cancelled');
    }

    // Restore stock in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Update sale status
      const updatedSale = await tx.sale.update({
        where: { id },
        data: {
          status: SaleStatus.CANCELLED,
        },
      });

      // Restore stock for each item
      for (const item of sale.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        const newStock = Number(product.stock) + Number(item.quantity);

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
          },
        });

        // Create stock movement for return
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            branchId: sale.branchId,
            userId,
            type: StockMovementType.RETURN,
            quantity: Number(item.quantity),
            previousStock: Number(product.stock),
            newStock,
            reason: 'Sale cancellation',
            referenceId: sale.id,
            inputMethod: InputMethod.MANUAL,
          },
        });
      }

      return updatedSale;
    });
  }

  async getDailySales(
    branchId: string,
    date?: Date,
    actor?: { userId: string; role: string },
  ) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const sales = await this.prisma.sale.findMany({
      where: {
        branchId,
        status: SaleStatus.COMPLETED,
        ...(this.shouldUseSelfScope(actor?.role) ? { userId: actor?.userId } : {}),
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                categoryId: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);

    const salesByCashier = sales.reduce((acc, sale) => {
      const userKey = sale.userId;
      const name = sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'Sin usuario';
      if (!acc[userKey]) {
        acc[userKey] = {
          userId: userKey,
          name,
          role: sale.user?.role || 'CASHIER',
          count: 0,
          amount: 0,
        };
      }
      acc[userKey].count += 1;
      acc[userKey].amount += Number(sale.total);
      return acc;
    }, {} as Record<string, { userId: string; name: string; role: string; count: number; amount: number }>);

    return {
      date: targetDate,
      totalSales,
      salesCount: sales.length,
      totalItems,
      averageTicket: sales.length > 0 ? totalSales / sales.length : 0,
      salesByCashier: Object.values(salesByCashier).sort((a, b) => b.amount - a.amount),
      sales,
    };
  }

  private generateSaleNumber(lastSaleNumber?: string): string {
    if (!lastSaleNumber) {
      return `SALE-${new Date().getFullYear()}-00001`;
    }

    const parts = lastSaleNumber.split('-');
    const sequence = parseInt(parts[2]) + 1;
    const year = new Date().getFullYear();

    return `SALE-${year}-${sequence.toString().padStart(5, '0')}`;
  }

  private normalizeInputMethod(method?: string): InputMethod {
    if (!method) {
      return InputMethod.MANUAL;
    }

    const value = String(method).toUpperCase();
    if (Object.values(InputMethod).includes(value as InputMethod)) {
      return value as InputMethod;
    }

    return InputMethod.MANUAL;
  }

  private resolvePayments(data: ISaleCreate, totalAmount: number) {
    const requestedPayments = (data.payments || [])
      .map((payment) => ({
        paymentMethod: payment.paymentMethod,
        amount: Number(payment.amount || 0),
      }))
      .filter((payment) => payment.amount > 0);

    const payments =
      requestedPayments.length > 0
        ? requestedPayments
        : [{ paymentMethod: data.paymentMethod || PaymentMethod.CASH, amount: Number(totalAmount) }];

    const roundedTotal = Math.round(Number(totalAmount));
    const roundedPayments = Math.round(payments.reduce((sum, payment) => sum + Number(payment.amount), 0));

    if (roundedPayments !== roundedTotal) {
      throw new BadRequestException('Los pagos registrados no coinciden con el total de la venta');
    }

    const salePaymentMethod =
      payments.length > 1 ? PaymentMethod.MIXED : (payments[0]?.paymentMethod || data.paymentMethod);

    return {
      payments,
      salePaymentMethod,
    };
  }

  private calculatePromotionDiscount(promotion: any, saleItems: any[], subtotal: number): number {
    if (!promotion) {
      return 0;
    }

    const conditions = (promotion.conditions as any) || {};
    const minSubtotal = Number(conditions.minSubtotal || 0);
    if (minSubtotal > 0 && subtotal < minSubtotal) {
      throw new BadRequestException(`La promocion requiere una compra minima de $${minSubtotal.toLocaleString('es-CL')}`);
    }

    if (promotion.type === 'COMBO' && Array.isArray(promotion.comboProducts) && promotion.comboProducts.length > 0) {
      const cartByProduct = saleItems.reduce((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + Number(item.quantity || 0);
        return acc;
      }, {} as Record<string, number>);

      const meetsCombo = promotion.comboProducts.every((comboProduct: any) => {
        const required = Number(comboProduct.quantity || 1);
        const inCart = Number(cartByProduct[comboProduct.productId] || 0);
        return inCart >= required;
      });

      if (!meetsCombo) {
        throw new BadRequestException('La venta no cumple con los productos requeridos para el combo');
      }
    }

    if (promotion.discountType === 'PERCENTAGE') {
      return Math.min(subtotal, Math.round((subtotal * Number(promotion.discountValue || 0)) / 100));
    }

    return Math.min(subtotal, Number(promotion.discountValue || 0));
  }

  private async assertBotilleriaSaleHours(branchId: string) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const restriction = await this.prisma.saleHoursRestriction.findUnique({
      where: {
        branchId_dayOfWeek: { branchId, dayOfWeek },
      },
    });

    if (!restriction || !restriction.isEnabled) {
      return;
    }

    if (currentTime < restriction.openTime || currentTime > restriction.closeTime) {
      throw new BadRequestException(
        `Venta de alcohol no permitida en este horario. Horario permitido: ${restriction.openTime} - ${restriction.closeTime}`
      );
    }
  }
}


