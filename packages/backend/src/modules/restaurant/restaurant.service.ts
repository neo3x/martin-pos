import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SalesService } from '../sales/sales.service';
import { PaymentMethod } from '@martin-pos/shared';
import { OrderStatus } from '@prisma/client';

const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PREPARING', 'READY'];
const CASHIER_ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER'];

@Injectable()
export class RestaurantService {
  constructor(
    private prisma: PrismaService,
    private salesService: SalesService
  ) {}

  private async getBranchTaxRate(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { config: true },
    });
    return Number((branch?.config as any)?.taxRate || 0.19);
  }

  private async ensureTable(tableId: string, branchId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, branchId, deletedAt: null },
    });

    if (!table) {
      throw new NotFoundException('Mesa no encontrada');
    }

    return table;
  }

  private async ensureOrder(orderId: string, branchId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, branchId, deletedAt: null },
      include: {
        table: true,
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        items: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return order;
  }

  private ensureCashierRole(role: string) {
    if (!CASHIER_ALLOWED_ROLES.includes(role)) {
      throw new ForbiddenException('No tiene permisos para cobrar esta cuenta');
    }
  }

  private generateOrderNumber(lastOrderNumber?: string): string {
    if (!lastOrderNumber) return 'ORD-00001';

    const parts = String(lastOrderNumber).split('-');
    const seq = Number(parts[parts.length - 1]);

    if (!Number.isFinite(seq)) {
      return `ORD-${Date.now()}`;
    }

    return `ORD-${String(seq + 1).padStart(5, '0')}`;
  }

  async getTables(branchId: string) {
    const tables: any[] = await this.prisma.table.findMany({
      where: { branchId, deletedAt: null },
      include: {
        orders: {
          where: {
            status: { in: ACTIVE_ORDER_STATUSES },
            deletedAt: null,
          },
          include: {
            waiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: { number: 'asc' },
    });

    return tables.map((table) => {
      const currentOrder = table.orders[0] || null;
      const itemsSubtotal = (currentOrder?.items || []).reduce(
        (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
        0,
      );
      return {
        ...table,
        currentOrder,
        currentDiners: currentOrder?.diners || table.currentDiners || 0,
        currentAccountSubtotal: itemsSubtotal,
      };
    });
  }

  async createTable(branchId: string, data: { number: string; capacity: number; status?: string }) {
    const exists = await this.prisma.table.findFirst({
      where: {
        branchId,
        number: data.number,
        deletedAt: null,
      },
    });

    if (exists) {
      throw new BadRequestException('Ya existe una mesa con ese número');
    }

    return this.prisma.table.create({
      data: {
        branchId,
        number: data.number,
        capacity: data.capacity,
        status: (data.status as any) || 'AVAILABLE',
      },
    });
  }

  async updateTable(
    tableId: string,
    branchId: string,
    data: { number?: string; capacity?: number; status?: string }
  ) {
    const table = await this.ensureTable(tableId, branchId);

    if (data.number && data.number !== table.number) {
      const exists = await this.prisma.table.findFirst({
        where: {
          branchId,
          number: data.number,
          deletedAt: null,
          id: { not: table.id },
        },
      });
      if (exists) {
        throw new BadRequestException('Ya existe otra mesa con ese número');
      }
    }

    return this.prisma.table.update({
      where: { id: table.id },
      data: {
        ...(data.number !== undefined ? { number: data.number } : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
        ...(data.status !== undefined ? { status: data.status as any } : {}),
      },
    });
  }

  async removeTable(tableId: string, branchId: string) {
    const table = await this.ensureTable(tableId, branchId);

    const activeOrder = await this.prisma.order.findFirst({
      where: {
        tableId: table.id,
        branchId,
        deletedAt: null,
        status: { in: ACTIVE_ORDER_STATUSES },
      },
    });

    if (activeOrder) {
      throw new BadRequestException('No se puede eliminar una mesa con pedido activo');
    }

    return this.prisma.table.update({
      where: { id: table.id },
      data: {
        deletedAt: new Date(),
        status: 'AVAILABLE',
        currentOrderId: null,
        currentDiners: 0,
        openedAt: null,
      },
    });
  }

  async openTable(
    tableId: string,
    branchId: string,
    data: { diners: number; waiterId?: string; notes?: string },
    fallbackWaiterId: string,
  ) {
    const table = await this.ensureTable(tableId, branchId);

    if (data.diners < 1) {
      throw new BadRequestException('La mesa debe tener al menos 1 comensal');
    }

    const activeOrder = await this.prisma.order.findFirst({
      where: {
        branchId,
        tableId: table.id,
        status: { in: ACTIVE_ORDER_STATUSES },
        deletedAt: null,
      },
    });

    if (activeOrder) {
      throw new BadRequestException('La mesa ya tiene una cuenta activa');
    }

    if (!['AVAILABLE', 'RESERVED'].includes(table.status)) {
      throw new BadRequestException('La mesa no está disponible para apertura');
    }

    const waiterId = data.waiterId || fallbackWaiterId;
    const waiter = await this.prisma.user.findFirst({
      where: {
        id: waiterId,
        branchId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!waiter) {
      throw new BadRequestException('Garzón no válido para esta sucursal');
    }

    const lastOrder = await this.prisma.order.findFirst({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });

    const orderNumber = this.generateOrderNumber(lastOrder?.orderNumber);

    const [order] = await this.prisma.$transaction([
      this.prisma.order.create({
        data: {
          orderNumber,
          branchId,
          tableId: table.id,
          waiterId,
          diners: data.diners,
          notes: data.notes,
          status: 'PENDING',
        },
      }),
      this.prisma.table.update({
        where: { id: table.id },
        data: {
          status: 'OCCUPIED',
          currentDiners: data.diners,
          openedAt: new Date(),
        },
      }),
    ]);

    await this.prisma.table.update({
      where: { id: table.id },
      data: { currentOrderId: order.id },
    });

    return this.getOrderAccount(order.id, branchId);
  }

  async getOrders(branchId: string, status?: string) {
    const where: any = { branchId, deletedAt: null };

    if (status === 'active') {
      where.status = { in: ACTIVE_ORDER_STATUSES };
    } else if (status) {
      where.status = status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        table: true,
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return Promise.all(
      orders.map(async (order) => {
        const account = await this.getOrderAccount(order.id, branchId);
        return {
          ...order,
          account,
        };
      })
    );
  }

  async addOrderItems(
    orderId: string,
    branchId: string,
    payload: {
      items: Array<{ productId: string; quantity: number; notes?: string }>;
    }
  ) {
    const order = await this.ensureOrder(orderId, branchId);

    if (!ACTIVE_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException('No se puede editar un pedido cerrado o cancelado');
    }

    if (!payload.items?.length) {
      throw new BadRequestException('Debe agregar al menos un item');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of payload.items) {
        if (!item.productId || item.quantity < 1) {
          throw new BadRequestException('Item de pedido inválido');
        }

        const product = await tx.product.findFirst({
          where: {
            id: item.productId,
            branchId,
            deletedAt: null,
            status: 'ACTIVE',
          },
        });

        if (!product) {
          throw new BadRequestException(`Producto inválido: ${item.productId}`);
        }

        await tx.orderItem.create({
          data: {
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            paidQuantity: 0,
            notes: item.notes,
            status: 'PENDING',
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PENDING',
        },
      });

      await tx.table.update({
        where: { id: order.tableId },
        data: {
          status: 'OCCUPIED',
          currentOrderId: order.id,
          currentDiners: order.diners,
          openedAt: order.table.openedAt || new Date(),
        },
      });
    });

    return this.getOrderAccount(order.id, branchId);
  }

  async updateOrderItem(
    orderId: string,
    itemId: string,
    branchId: string,
    data: {
      quantity?: number;
      notes?: string;
      status?: string;
    }
  ) {
    const order = await this.ensureOrder(orderId, branchId);

    if (!ACTIVE_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException('No se puede editar un pedido cerrado o cancelado');
    }

    const item = order.items.find((it) => it.id === itemId);
    if (!item) {
      throw new NotFoundException('Item no encontrado en el pedido');
    }

    if (data.quantity !== undefined && data.quantity < Number(item.paidQuantity)) {
      throw new BadRequestException('La cantidad no puede ser menor a lo ya cobrado');
    }

    await this.prisma.orderItem.update({
      where: { id: item.id },
      data: {
        ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.status !== undefined ? { status: data.status as any } : {}),
      },
    });

    return this.getOrderAccount(orderId, branchId);
  }

  async removeOrderItem(orderId: string, itemId: string, branchId: string) {
    const order = await this.ensureOrder(orderId, branchId);

    if (!ACTIVE_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException('No se puede editar un pedido cerrado o cancelado');
    }

    const item = order.items.find((it) => it.id === itemId);
    if (!item) {
      throw new NotFoundException('Item no encontrado en el pedido');
    }

    if (Number(item.paidQuantity) > 0) {
      throw new BadRequestException('No se puede eliminar un item que ya tiene pagos registrados');
    }

    await this.prisma.orderItem.delete({ where: { id: item.id } });

    return this.getOrderAccount(orderId, branchId);
  }

  async assignWaiter(orderId: string, branchId: string, waiterId: string) {
    await this.ensureOrder(orderId, branchId);

    const waiter = await this.prisma.user.findFirst({
      where: {
        id: waiterId,
        branchId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!waiter) {
      throw new BadRequestException('Garzón no válido para esta sucursal');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { waiterId },
    });

    return this.getOrderAccount(orderId, branchId);
  }

  async updateDiners(orderId: string, branchId: string, diners: number) {
    if (diners < 1) {
      throw new BadRequestException('La cantidad de comensales debe ser mayor a 0');
    }

    const order = await this.ensureOrder(orderId, branchId);

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: { diners },
      }),
      this.prisma.table.update({
        where: { id: order.tableId },
        data: { currentDiners: diners },
      }),
    ]);

    return this.getOrderAccount(orderId, branchId);
  }

  async splitPreview(orderId: string, branchId: string, parts: number) {
    if (!Number.isInteger(parts) || parts < 2) {
      throw new BadRequestException('La división debe ser en 2 o más partes');
    }

    const account = await this.getOrderAccount(orderId, branchId);
    const total = Math.round(Number(account.totals.remainingTotal));

    if (total <= 0) {
      throw new BadRequestException('No hay saldo pendiente para dividir');
    }

    const base = Math.floor(total / parts);
    const remainder = total % parts;

    return {
      orderId,
      parts,
      split: Array.from({ length: parts }).map((_, index) => ({
        part: index + 1,
        amount: base + (index < remainder ? 1 : 0),
      })),
      currency: 'CLP',
    };
  }

  async payOrder(
    orderId: string,
    branchId: string,
    cashier: { id: string; role: string },
    payload: {
      paymentMethod: PaymentMethod;
      notes?: string;
      mode?: 'FULL' | 'CUSTOM';
      items?: Array<{ orderItemId: string; quantity: number }>;
    }
  ) {
    this.ensureCashierRole(cashier.role);

    const openRegister = await this.prisma.cashRegister.findFirst({
      where: {
        branchId,
        userId: cashier.id,
        status: 'OPEN',
      },
      select: { id: true },
    });

    if (!openRegister) {
      throw new BadRequestException('Debe abrir una caja para cobrar cuentas');
    }

    const order = await this.ensureOrder(orderId, branchId);
    if (!ACTIVE_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException('El pedido no está activo para cobro');
    }

    const remainingItems = order.items
      .map((item) => ({
        ...item,
        remainingQuantity: Number(item.quantity) - Number(item.paidQuantity),
      }))
      .filter((item) => item.remainingQuantity > 0);

    if (remainingItems.length === 0) {
      throw new BadRequestException('No hay saldo pendiente en este pedido');
    }

    let selected: Array<{ orderItemId: string; quantity: number }>;

    if (payload.mode === 'CUSTOM') {
      if (!payload.items?.length) {
        throw new BadRequestException('Debe indicar items para cobro parcial');
      }
      selected = payload.items;
    } else {
      selected = remainingItems.map((item) => ({
        orderItemId: item.id,
        quantity: item.remainingQuantity,
      }));
    }

    const indexedItems = new Map(remainingItems.map((item) => [item.id, item]));

    const saleItems = selected.map((item) => {
      const source = indexedItems.get(item.orderItemId);
      if (!source) {
        throw new BadRequestException('Uno de los items seleccionados no tiene saldo pendiente');
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > source.remainingQuantity) {
        throw new BadRequestException(`Cantidad inválida para ${source.product.name}`);
      }

      return {
        orderItemId: source.id,
        productId: source.productId,
        quantity: item.quantity,
        unitPrice: Number(source.unitPrice),
        notes: source.notes || undefined,
      };
    });

    const sale = await this.salesService.create(
      {
        items: saleItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        })),
        paymentMethod: payload.paymentMethod,
        tableId: order.tableId,
        orderId: order.id,
        notes: payload.notes,
      },
      cashier.id,
      branchId,
    );

    await this.prisma.$transaction(async (tx) => {
      for (const item of saleItems) {
        await tx.orderItem.update({
          where: { id: item.orderItemId },
          data: {
            paidQuantity: {
              increment: item.quantity,
            },
          },
        });
      }

      const refreshed = await tx.orderItem.findMany({
        where: { orderId: order.id },
        select: { quantity: true, paidQuantity: true },
      });

      const fullyPaid = refreshed.every((item) => Number(item.paidQuantity) >= Number(item.quantity));

      if (fullyPaid) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'SERVED',
            closedAt: new Date(),
          },
        });

        await tx.table.update({
          where: { id: order.tableId },
          data: {
            status: 'CLEANING',
            currentOrderId: null,
            currentDiners: 0,
          },
        });
      }
    });

    const account = await this.getOrderAccount(order.id, branchId);

    return {
      sale,
      account,
      message: Number(account.totals.remainingTotal) > 0
        ? 'Cobro parcial registrado'
        : 'Cuenta cerrada y mesa lista para limpieza',
    };
  }

  async closeAccount(orderId: string, branchId: string) {
    const order = await this.ensureOrder(orderId, branchId);
    const account = await this.getOrderAccount(order.id, branchId);

    if (Number(account.totals.remainingTotal) > 0) {
      throw new BadRequestException('No se puede cerrar la cuenta, aún hay saldo pendiente');
    }

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'SERVED',
          closedAt: new Date(),
        },
      }),
      this.prisma.table.update({
        where: { id: order.tableId },
        data: {
          status: 'CLEANING',
          currentOrderId: null,
          currentDiners: 0,
        },
      }),
    ]);

    return this.getOrderAccount(order.id, branchId);
  }

  async releaseTable(tableId: string, branchId: string) {
    const table = await this.ensureTable(tableId, branchId);

    const activeOrder = await this.prisma.order.findFirst({
      where: {
        tableId: table.id,
        branchId,
        deletedAt: null,
        status: { in: ACTIVE_ORDER_STATUSES },
      },
    });

    if (activeOrder) {
      throw new BadRequestException('No se puede liberar una mesa con cuenta activa');
    }

    return this.prisma.table.update({
      where: { id: table.id },
      data: {
        status: 'AVAILABLE',
        currentOrderId: null,
        currentDiners: 0,
        openedAt: null,
      },
    });
  }

  async updateOrderStatus(orderId: string, branchId: string, status: string) {
    const order = await this.ensureOrder(orderId, branchId);

    if (status === 'SERVED') {
      const account = await this.getOrderAccount(orderId, branchId);
      if (Number(account.totals.remainingTotal) > 0) {
        throw new BadRequestException('No se puede marcar como SERVED con saldo pendiente');
      }
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: status as any,
        ...(status === 'SERVED' ? { closedAt: new Date() } : {}),
      },
    });

    return this.getOrderAccount(order.id, branchId);
  }

  async getOrderAccount(orderId: string, branchId: string) {
    const order = await this.ensureOrder(orderId, branchId);
    const taxRate = await this.getBranchTaxRate(branchId);

    const lines = order.items.map((item) => {
      const quantity = Number(item.quantity);
      const paidQuantity = Number(item.paidQuantity);
      const remainingQuantity = Math.max(0, quantity - paidQuantity);
      const unitPrice = Number(item.unitPrice || 0);

      const subtotal = quantity * unitPrice;
      const paidSubtotal = paidQuantity * unitPrice;
      const remainingSubtotal = remainingQuantity * unitPrice;

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Producto',
        quantity,
        paidQuantity,
        remainingQuantity,
        unitPrice,
        subtotal,
        paidSubtotal,
        remainingSubtotal,
        notes: item.notes,
        status: item.status,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const paidSubtotal = lines.reduce((sum, line) => sum + line.paidSubtotal, 0);
    const remainingSubtotal = lines.reduce((sum, line) => sum + line.remainingSubtotal, 0);

    const tax = Math.round(subtotal * taxRate);
    const paidTax = Math.round(paidSubtotal * taxRate);
    const remainingTax = Math.round(remainingSubtotal * taxRate);

    const total = subtotal + tax;
    const paidTotal = paidSubtotal + paidTax;
    const remainingTotal = Math.max(0, total - paidTotal);

    const payments = await this.prisma.sale.findMany({
      where: {
        branchId,
        orderId: order.id,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        saleNumber: true,
        paymentMethod: true,
        total: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        diners: order.diners,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        closedAt: order.closedAt,
      },
      table: {
        id: order.table.id,
        number: order.table.number,
        capacity: order.table.capacity,
        status: order.table.status,
      },
      waiter: order.waiter,
      lines,
      payments,
      totals: {
        taxRate,
        subtotal,
        tax,
        total,
        paidSubtotal,
        paidTax,
        paidTotal,
        remainingSubtotal,
        remainingTax,
        remainingTotal,
      },
      isFullyPaid: remainingTotal <= 0,
    };
  }
}
