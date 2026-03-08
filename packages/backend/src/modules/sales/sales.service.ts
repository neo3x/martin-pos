import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductsService } from '../products/products.service';
import { ISaleCreate, SaleStatus, StockMovementType, InputMethod, ProductStatus } from '@martin-pos/shared';
import { calculateSaleTotal } from '@martin-pos/shared';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService
  ) {}

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
    });
    const taxRate = (branch?.config as any)?.taxRate || 0.19;

    // All stock validation and mutation inside a single transaction
    const sale = await this.prisma.$transaction(async (tx) => {
      // Validate stock inside transaction to prevent race conditions
      const saleItems = [];
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
        const itemDiscount = item.discount || 0;
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

      const totals = calculateSaleTotal(subtotal, taxRate, data.discount || 0);

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
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          tableId: data.tableId,
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
            inputMethod: InputMethod.MANUAL,
          },
        });
      }

      return newSale;
    });

    this.logger.log(`Sale created: ${sale.saleNumber} total=${sale.total} by user ${userId}`);
    return sale;
  }

  async findAll(branchId: string, filters?: any) {
    const where: any = {
      branchId,
      deletedAt: null,
    };

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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
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
          },
        },
        branch: true,
      },
    });

    if (!sale || sale.deletedAt) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async cancelSale(id: string, userId: string) {
    const sale = await this.findOne(id);

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

  async getDailySales(branchId: string, date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const sales = await this.prisma.sale.findMany({
      where: {
        branchId,
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { items: true },
    });

    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);

    return {
      date: targetDate,
      totalSales,
      salesCount: sales.length,
      totalItems,
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
}
