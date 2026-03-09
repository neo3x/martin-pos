import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SalesService } from '../sales/sales.service';
import { PaymentMethod } from '@martin-pos/shared';
import { OrderStatus, ReservationStatus } from '@prisma/client';

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

  private normalizeTipPercent(raw: number) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return 10;
    return Math.min(100, Math.max(0, Math.round(parsed * 100) / 100));
  }

  private async getBranchTipSuggestionPercent(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { config: true },
    });
    return this.normalizeTipPercent((branch?.config as any)?.restaurantTipSuggestionPercent ?? 10);
  }

  async updateTipSuggestion(branchId: string, percent: number) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, config: true },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    const sanitized = this.normalizeTipPercent(percent);
    const config = {
      ...((branch.config as any) || {}),
      restaurantTipSuggestionPercent: sanitized,
    };

    await this.prisma.branch.update({
      where: { id: branch.id },
      data: { config },
    });

    return {
      branchId,
      tipSuggestionPercent: sanitized,
      message: 'Propina sugerida actualizada',
    };
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

  private async ensureReservation(reservationId: string, branchId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        branchId,
        deletedAt: null,
      },
      include: {
        table: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return reservation;
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

  private async syncTableReservationStatus(tableId: string, branchId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, branchId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!table) return;

    const hasActiveOrder = await this.prisma.order.findFirst({
      where: {
        tableId,
        branchId,
        deletedAt: null,
        status: { in: ACTIVE_ORDER_STATUSES },
      },
      select: { id: true },
    });

    if (hasActiveOrder) return;

    const hasUpcomingReservation = await this.prisma.reservation.findFirst({
      where: {
        branchId,
        tableId,
        deletedAt: null,
        status: { in: ['PENDING', 'CONFIRMED'] },
        reservationAt: {
          gte: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      },
      select: { id: true },
    });

    if (hasUpcomingReservation && table.status === 'AVAILABLE') {
      await this.prisma.table.update({
        where: { id: table.id },
        data: { status: 'RESERVED' },
      });
      return;
    }

    if (!hasUpcomingReservation && table.status === 'RESERVED') {
      await this.prisma.table.update({
        where: { id: table.id },
        data: { status: 'AVAILABLE' },
      });
    }
  }

  async getTables(branchId: string, filters?: { sector?: string }) {
    const tables: any[] = await this.prisma.table.findMany({
      where: {
        branchId,
        deletedAt: null,
        ...(filters?.sector ? { sector: filters.sector } : {}),
      },
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
        reservations: {
          where: {
            deletedAt: null,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          orderBy: { reservationAt: 'asc' },
          take: 3,
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
      const paidSubtotal = (currentOrder?.items || []).reduce(
        (sum, item) => sum + Number(item.unitPrice) * Number(item.paidQuantity || 0),
        0,
      );
      const remainingSubtotal = Math.max(0, itemsSubtotal - paidSubtotal);
      const openedAt = table.openedAt ? new Date(table.openedAt) : null;
      const elapsedMinutes = openedAt
        ? Math.max(0, Math.floor((Date.now() - openedAt.getTime()) / (1000 * 60)))
        : 0;

      let operationalStatus = table.status;
      if (currentOrder && remainingSubtotal > 0 && ['READY', 'SERVED'].includes(currentOrder.status)) {
        operationalStatus = 'PENDING_PAYMENT';
      } else if (table.status === 'CLEANING') {
        operationalStatus = 'CLOSED';
      }

      return {
        ...table,
        currentOrder,
        currentDiners: currentOrder?.diners || table.currentDiners || 0,
        currentAccountSubtotal: itemsSubtotal,
        currentAccountRemaining: remainingSubtotal,
        elapsedMinutes,
        operationalStatus,
        nextReservation: table.reservations?.[0] || null,
      };
    });
  }

  async getReservations(branchId: string, filters?: { status?: string; from?: string; to?: string }) {
    const where: any = {
      branchId,
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status as ReservationStatus;
    }

    if (filters?.from || filters?.to) {
      where.reservationAt = {};
      if (filters?.from) where.reservationAt.gte = new Date(filters.from);
      if (filters?.to) where.reservationAt.lte = new Date(filters.to);
    }

    return this.prisma.reservation.findMany({
      where,
      include: {
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
            status: true,
            sector: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { reservationAt: 'asc' },
      take: 200,
    });
  }

  async createReservation(
    branchId: string,
    createdById: string,
    data: {
      customerName: string;
      customerPhone?: string;
      partySize: number;
      reservationAt: string;
      tableId?: string;
      notes?: string;
      status?: ReservationStatus;
    },
  ) {
    if (!data.customerName?.trim()) {
      throw new BadRequestException('Debe indicar el nombre del cliente');
    }

    if (!Number.isInteger(data.partySize) || data.partySize < 1) {
      throw new BadRequestException('Cantidad de personas invalida');
    }

    const reservationAt = new Date(data.reservationAt);
    if (Number.isNaN(reservationAt.getTime())) {
      throw new BadRequestException('Fecha/hora de reserva invalida');
    }

    if (data.tableId) {
      const table = await this.ensureTable(data.tableId, branchId);
      if (table.capacity < data.partySize) {
        throw new BadRequestException('La mesa no soporta la cantidad de personas');
      }

      const activeOrder = await this.prisma.order.findFirst({
        where: {
          branchId,
          tableId: table.id,
          deletedAt: null,
          status: { in: ACTIVE_ORDER_STATUSES },
        },
        select: { id: true },
      });

      if (activeOrder) {
        throw new BadRequestException('La mesa tiene una cuenta activa');
      }
    }

    const status = (data.status || 'CONFIRMED') as ReservationStatus;

    const reservation = await this.prisma.reservation.create({
      data: {
        branchId,
        createdById,
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone?.trim() || null,
        partySize: data.partySize,
        reservationAt,
        tableId: data.tableId || null,
        notes: data.notes?.trim() || null,
        status,
      },
      include: {
        table: true,
      },
    });

    if (reservation.tableId && ['PENDING', 'CONFIRMED'].includes(reservation.status)) {
      await this.prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: 'RESERVED' },
      });
    }

    return reservation;
  }

  async updateReservation(
    reservationId: string,
    branchId: string,
    data: {
      customerName?: string;
      customerPhone?: string;
      partySize?: number;
      reservationAt?: string;
      tableId?: string | null;
      notes?: string;
      status?: ReservationStatus;
    },
  ) {
    const reservation = await this.ensureReservation(reservationId, branchId);
    const previousTableId = reservation.tableId;
    const nextTableId = data.tableId === undefined ? reservation.tableId : data.tableId;

    if (data.partySize !== undefined && (!Number.isInteger(data.partySize) || data.partySize < 1)) {
      throw new BadRequestException('Cantidad de personas invalida');
    }

    if (nextTableId) {
      const table = await this.ensureTable(nextTableId, branchId);
      const partySize = data.partySize ?? reservation.partySize;
      if (table.capacity < partySize) {
        throw new BadRequestException('La mesa no soporta la cantidad de personas');
      }

      const activeOrder = await this.prisma.order.findFirst({
        where: {
          branchId,
          tableId: table.id,
          deletedAt: null,
          status: { in: ACTIVE_ORDER_STATUSES },
        },
        select: { id: true },
      });

      if (activeOrder) {
        throw new BadRequestException('La mesa seleccionada tiene una cuenta activa');
      }
    }

    const reservationAt = data.reservationAt ? new Date(data.reservationAt) : undefined;
    if (reservationAt && Number.isNaN(reservationAt.getTime())) {
      throw new BadRequestException('Fecha/hora de reserva invalida');
    }

    const updated = await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        ...(data.customerName !== undefined ? { customerName: data.customerName.trim() } : {}),
        ...(data.customerPhone !== undefined ? { customerPhone: data.customerPhone.trim() || null } : {}),
        ...(data.partySize !== undefined ? { partySize: data.partySize } : {}),
        ...(reservationAt ? { reservationAt } : {}),
        ...(data.tableId !== undefined ? { tableId: data.tableId || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes.trim() || null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: { table: true },
    });

    if (previousTableId && previousTableId !== updated.tableId) {
      await this.syncTableReservationStatus(previousTableId, branchId);
    }

    if (updated.tableId && ['PENDING', 'CONFIRMED'].includes(updated.status)) {
      await this.prisma.table.update({
        where: { id: updated.tableId },
        data: { status: 'RESERVED' },
      });
    } else if (updated.tableId) {
      await this.syncTableReservationStatus(updated.tableId, branchId);
    }

    return updated;
  }

  async updateReservationStatus(
    reservationId: string,
    branchId: string,
    status: ReservationStatus,
  ) {
    const reservation = await this.ensureReservation(reservationId, branchId);
    const nextStatus = status as ReservationStatus;

    const updated = await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: nextStatus },
      include: { table: true },
    });

    if (updated.tableId && ['PENDING', 'CONFIRMED'].includes(nextStatus)) {
      await this.prisma.table.update({
        where: { id: updated.tableId },
        data: { status: 'RESERVED' },
      });
    } else if (updated.tableId) {
      await this.syncTableReservationStatus(updated.tableId, branchId);
    }

    return updated;
  }

  async seatReservation(
    reservationId: string,
    branchId: string,
    fallbackWaiterId: string,
    data?: { waiterId?: string; notes?: string },
  ) {
    const reservation = await this.ensureReservation(reservationId, branchId);

    if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
      throw new BadRequestException('La reserva no esta disponible para sentar');
    }

    if (!reservation.tableId) {
      throw new BadRequestException('La reserva no tiene mesa asignada');
    }

    const account = await this.openTable(
      reservation.tableId,
      branchId,
      {
        diners: reservation.partySize,
        waiterId: data?.waiterId,
        notes: data?.notes || reservation.notes || undefined,
      },
      fallbackWaiterId,
    );

    const updatedReservation = await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'SEATED' },
      include: { table: true },
    });

    return {
      reservation: updatedReservation,
      account,
    };
  }

  async getKitchenQueue(branchId: string, minWaitMinutes = 0) {
    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        deletedAt: null,
        status: { in: ACTIVE_ORDER_STATUSES },
      },
      include: {
        table: {
          select: {
            id: true,
            number: true,
          },
        },
        waiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          where: {
            sentToKitchen: true,
            status: { in: ['PENDING', 'PREPARING', 'READY'] },
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const queue = orders
      .map((order) => {
        const now = Date.now();
        const oldestItem = order.items[0];
        const waitMinutes = oldestItem
          ? Math.max(0, Math.floor((now - new Date(oldestItem.createdAt).getTime()) / (1000 * 60)))
          : 0;

        const alertLevel = waitMinutes >= 30 ? 'CRITICAL' : waitMinutes >= 20 ? 'WARNING' : 'NORMAL';

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          diners: order.diners,
          table: order.table,
          waiter: order.waiter,
          createdAt: order.createdAt,
          waitMinutes,
          alertLevel,
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product?.name || 'Producto',
            quantity: item.quantity,
            status: item.status,
            notes: item.notes,
            sentAt: item.sentAt,
            waitMinutes: Math.max(
              0,
              Math.floor((now - new Date(item.createdAt).getTime()) / (1000 * 60)),
            ),
          })),
        };
      })
      .filter((order) => order.waitMinutes >= Math.max(0, Number(minWaitMinutes || 0)))
      .sort((a, b) => b.waitMinutes - a.waitMinutes);

    const summary = queue.reduce(
      (acc, order) => {
        for (const item of order.items) {
          if (item.status === 'PENDING') acc.pending += 1;
          if (item.status === 'PREPARING') acc.preparing += 1;
          if (item.status === 'READY') acc.ready += 1;
          if (item.waitMinutes >= 20) acc.overdue += 1;
          acc.totalItems += 1;
        }
        return acc;
      },
      { pending: 0, preparing: 0, ready: 0, overdue: 0, totalItems: 0 },
    );

    return {
      queue,
      summary,
    };
  }

  async getDashboard(branchId: string) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [tables, salesToday, ordersToday, activeOrders, reservationsToday, pendingServiceRequests, tipSuggestionPercent] = await Promise.all([
      this.getTables(branchId),
      this.prisma.sale.findMany({
        where: {
          branchId,
          status: 'COMPLETED',
          tableId: { not: null },
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      this.prisma.order.findMany({
        where: {
          branchId,
          deletedAt: null,
          status: 'SERVED',
          closedAt: { gte: startOfDay, lte: endOfDay },
        },
        select: {
          id: true,
          createdAt: true,
          closedAt: true,
        },
      }),
      this.prisma.order.findMany({
        where: {
          branchId,
          deletedAt: null,
          status: { in: ACTIVE_ORDER_STATUSES },
        },
        include: {
          items: {
            where: { status: { in: ['PENDING', 'PREPARING', 'READY'] }, sentToKitchen: true },
            select: { status: true },
          },
        },
      }),
      this.prisma.reservation.findMany({
        where: {
          branchId,
          deletedAt: null,
          reservationAt: { gte: startOfDay, lte: endOfDay },
          status: { in: ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] },
        },
      }),
      this.prisma.tableServiceRequest.count({
        where: {
          branchId,
          status: 'PENDING',
        },
      }),
      this.getBranchTipSuggestionPercent(branchId),
    ]);

    const ordersById = new Map<string, number>();
    for (const sale of salesToday) {
      if (sale.orderId) {
        ordersById.set(sale.orderId, (ordersById.get(sale.orderId) || 0) + Number(sale.total));
      }
    }

    const waiterSource = Array.from(ordersById.keys());
    const waiterOrders = waiterSource.length
      ? await this.prisma.order.findMany({
          where: { id: { in: waiterSource } },
          include: {
            waiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        })
      : [];

    const waiterNameByOrder = new Map<string, string>();
    for (const order of waiterOrders) {
      waiterNameByOrder.set(
        order.id,
        order.waiter ? `${order.waiter.firstName} ${order.waiter.lastName}` : 'Sin garzon',
      );
    }

    const salesByWaiterMap = new Map<string, number>();
    for (const [orderId, total] of ordersById.entries()) {
      const waiter = waiterNameByOrder.get(orderId) || 'Sin garzon';
      salesByWaiterMap.set(waiter, (salesByWaiterMap.get(waiter) || 0) + total);
    }

    const productMap = new Map<string, { productId: string; name: string; quantity: number; total: number }>();
    for (const sale of salesToday) {
      for (const item of sale.items) {
        const current = productMap.get(item.productId) || {
          productId: item.productId,
          name: item.product?.name || 'Producto',
          quantity: 0,
          total: 0,
        };
        current.quantity += Number(item.quantity);
        current.total += Number(item.total);
        productMap.set(item.productId, current);
      }
    }

    const tableSummary = tables.reduce(
      (acc, table: any) => {
        if (table.operationalStatus === 'AVAILABLE') acc.available += 1;
        else if (table.operationalStatus === 'RESERVED') acc.reserved += 1;
        else if (table.operationalStatus === 'PENDING_PAYMENT') acc.pendingPayment += 1;
        else if (table.operationalStatus === 'CLOSED') acc.closed += 1;
        else acc.occupied += 1;
        return acc;
      },
      { available: 0, occupied: 0, reserved: 0, pendingPayment: 0, closed: 0 },
    );

    const kitchen = activeOrders.reduce(
      (acc, order) => {
        for (const item of order.items) {
          if (item.status === 'PENDING') acc.pending += 1;
          if (item.status === 'PREPARING') acc.preparing += 1;
          if (item.status === 'READY') acc.ready += 1;
        }
        return acc;
      },
      { pending: 0, preparing: 0, ready: 0 },
    );

    const totalSales = salesToday.reduce((sum, sale) => sum + Number(sale.total), 0);
    const averageTicket = salesToday.length > 0 ? totalSales / salesToday.length : 0;
    const avgTableMinutes = ordersToday.length > 0
      ? ordersToday.reduce((sum, order) => {
          const endTime = order.closedAt ? new Date(order.closedAt).getTime() : Date.now();
          return sum + Math.max(0, Math.floor((endTime - new Date(order.createdAt).getTime()) / (1000 * 60)));
        }, 0) / ordersToday.length
      : 0;

    return {
      tables: tableSummary,
      sales: {
        count: salesToday.length,
        amount: totalSales,
        averageTicket,
      },
      orders: {
        open: activeOrders.length,
        avgTableMinutes,
      },
      reservations: {
        totalToday: reservationsToday.length,
        pending: reservationsToday.filter((r) => ['PENDING', 'CONFIRMED'].includes(r.status)).length,
        seated: reservationsToday.filter((r) => r.status === 'SEATED').length,
      },
      serviceRequests: {
        pending: pendingServiceRequests,
      },
      kitchen,
      settings: {
        tipSuggestionPercent,
      },
      salesByWaiter: Array.from(salesByWaiterMap.entries())
        .map(([waiter, amount]) => ({ waiter, amount }))
        .sort((a, b) => b.amount - a.amount),
      topProducts: Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8),
    };
  }

  async createTable(branchId: string, data: { number: string; capacity: number; status?: string; sector?: string }) {
    const exists = await this.prisma.table.findFirst({
      where: {
        branchId,
        number: data.number,
        deletedAt: null,
      },
    });

    if (exists) {
      throw new BadRequestException('Ya existe una mesa con ese nÃºmero');
    }

    return this.prisma.table.create({
      data: {
        branchId,
        number: data.number,
        capacity: data.capacity,
        status: (data.status as any) || 'AVAILABLE',
        sector: data.sector || null,
      },
    });
  }

  async updateTable(
    tableId: string,
    branchId: string,
    data: { number?: string; capacity?: number; status?: string; sector?: string | null }
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
        throw new BadRequestException('Ya existe otra mesa con ese nÃºmero');
      }
    }

    return this.prisma.table.update({
      where: { id: table.id },
      data: {
        ...(data.number !== undefined ? { number: data.number } : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
        ...(data.status !== undefined ? { status: data.status as any } : {}),
        ...(data.sector !== undefined ? { sector: data.sector || null } : {}),
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

    const upcomingReservation = await this.prisma.reservation.findFirst({
      where: {
        tableId: table.id,
        branchId,
        deletedAt: null,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { id: true },
    });

    if (upcomingReservation) {
      throw new BadRequestException('No se puede eliminar una mesa con reservas activas');
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
      throw new BadRequestException('La mesa no estÃ¡ disponible para apertura');
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
      throw new BadRequestException('GarzÃ³n no vÃ¡lido para esta sucursal');
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
          sentToKitchen: false,
          sentToKitchenAt: null,
          sentToCashier: false,
          sentToCashierAt: null,
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

    await this.prisma.reservation.updateMany({
      where: {
        branchId,
        tableId: table.id,
        deletedAt: null,
        status: { in: ['PENDING', 'CONFIRMED'] },
        reservationAt: {
          lte: new Date(Date.now() + 4 * 60 * 60 * 1000),
        },
      },
      data: { status: 'SEATED' },
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

  async getOrdersBoard(branchId: string, status?: string) {
    const where: any = { branchId, deletedAt: null };

    if (status === 'active') {
      where.status = { in: ACTIVE_ORDER_STATUSES };
    } else if (status) {
      where.status = status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        table: {
          select: { id: true, number: true, sector: true, status: true },
        },
        waiter: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        items: {
          select: {
            id: true,
            status: true,
            quantity: true,
            paidQuantity: true,
            sentToKitchen: true,
            createdAt: true,
          },
        },
        serviceRequests: {
          where: { status: { in: ['PENDING', 'ACKNOWLEDGED'] } },
          select: { id: true, type: true, status: true, requestedAt: true },
          orderBy: { requestedAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });

    const normalized = orders.map((order) => {
      const now = Date.now();
      const totals = order.items.reduce(
        (acc, item) => {
          if (item.status === 'PENDING') acc.pending += 1;
          if (item.status === 'PREPARING') acc.preparing += 1;
          if (item.status === 'READY') acc.ready += 1;
          if (item.status === 'SERVED') acc.served += 1;
          if (!item.sentToKitchen && Number(item.quantity) > Number(item.paidQuantity || 0)) acc.draft += 1;
          return acc;
        },
        { pending: 0, preparing: 0, ready: 0, served: 0, draft: 0 },
      );

      const oldest = order.items[0];
      const waitMinutes = oldest
        ? Math.max(0, Math.floor((now - new Date(oldest.createdAt).getTime()) / (1000 * 60)))
        : 0;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        diners: order.diners,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        sentToKitchen: order.sentToKitchen,
        sentToKitchenAt: order.sentToKitchenAt,
        sentToCashier: order.sentToCashier,
        sentToCashierAt: order.sentToCashierAt,
        waitMinutes,
        table: order.table,
        waiter: order.waiter,
        serviceRequests: order.serviceRequests,
        metrics: totals,
      };
    });

    const summary = normalized.reduce(
      (acc, order) => {
        acc.total += 1;
        if (order.status === 'PENDING') acc.pendingOrders += 1;
        if (order.status === 'PREPARING') acc.preparingOrders += 1;
        if (order.status === 'READY') acc.readyOrders += 1;
        if (order.metrics.draft > 0) acc.withDraftItems += 1;
        acc.pendingServiceRequests += order.serviceRequests.filter((r) => r.status === 'PENDING').length;
        return acc;
      },
      {
        total: 0,
        pendingOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        withDraftItems: 0,
        pendingServiceRequests: 0,
      },
    );

    return {
      summary,
      orders: normalized,
    };
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
          throw new BadRequestException('Item de pedido invÃ¡lido');
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
          throw new BadRequestException(`Producto invÃ¡lido: ${item.productId}`);
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
            sentToKitchen: false,
            sentAt: null,
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PENDING',
          sentToCashier: false,
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

  async sendOrder(
    orderId: string,
    branchId: string,
    sentById: string,
    targets?: Array<'KITCHEN' | 'CASHIER'>,
  ) {
    const order = await this.ensureOrder(orderId, branchId);

    if (!ACTIVE_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException('No se puede enviar un pedido cerrado o cancelado');
    }

    const normalizedTargets = (targets?.length ? targets : ['KITCHEN', 'CASHIER']) as Array<'KITCHEN' | 'CASHIER'>;
    const sendToKitchen = normalizedTargets.includes('KITCHEN');
    const sendToCashier = normalizedTargets.includes('CASHIER');

    if (!sendToKitchen && !sendToCashier) {
      throw new BadRequestException('Debe indicar al menos un destino de envio');
    }

    const draftItems = order.items.filter(
      (item) => !item.sentToKitchen && Number(item.quantity) > Number(item.paidQuantity || 0),
    );

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (sendToKitchen && draftItems.length > 0) {
        await tx.orderItem.updateMany({
          where: { id: { in: draftItems.map((item) => item.id) } },
          data: {
            sentToKitchen: true,
            sentAt: now,
            status: 'PENDING',
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          ...(sendToKitchen ? { sentToKitchen: true, sentToKitchenAt: now } : {}),
          ...(sendToCashier ? { sentToCashier: true, sentToCashierAt: now } : {}),
          status: order.status === 'READY' ? 'READY' : 'PENDING',
          notes: [order.notes, `Enviado por ${sentById} ${now.toISOString()}`]
            .filter(Boolean)
            .join(' | '),
        },
      });
    });

    const account = await this.getOrderAccount(order.id, branchId);

    return {
      account,
      sentItems: sendToKitchen ? draftItems.length : 0,
      sentToKitchen: sendToKitchen,
      sentToCashier: sendToCashier,
      message:
        sendToKitchen && draftItems.length > 0
          ? `Pedido enviado: ${draftItems.length} item(s) a cocina y visible para caja`
          : sendToCashier
            ? 'Pedido visible para caja'
            : 'Sin cambios de envio',
    };
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
        ...(data.status !== undefined && !item.sentToKitchen ? { sentToKitchen: true, sentAt: new Date() } : {}),
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
      throw new BadRequestException('GarzÃ³n no vÃ¡lido para esta sucursal');
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
      throw new BadRequestException('La divisiÃ³n debe ser en 2 o mÃ¡s partes');
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
      tipAmount?: number;
      tipPaymentMethod?: PaymentMethod;
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
      throw new BadRequestException('El pedido no estÃ¡ activo para cobro');
    }

    if (!order.sentToCashier) {
      throw new BadRequestException('Debe enviar el pedido a caja antes de cobrar');
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
        throw new BadRequestException(`Cantidad invÃ¡lida para ${source.product.name}`);
      }

      return {
        orderItemId: source.id,
        productId: source.productId,
        quantity: item.quantity,
        unitPrice: Number(source.unitPrice),
        notes: source.notes || undefined,
      };
    });

    const tipAmount = Math.max(0, Math.round(Number(payload.tipAmount || 0)));

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

    if (tipAmount > 0) {
      const tipPaymentMethod = payload.tipPaymentMethod || payload.paymentMethod;
      await this.prisma.$transaction([
        this.prisma.cashTransaction.create({
          data: {
            cashRegisterId: openRegister.id,
            userId: cashier.id,
            type: 'INCOME',
            amount: tipAmount,
            paymentMethod: tipPaymentMethod as any,
            description: `Propina sugerida - Pedido ${order.orderNumber}`,
            saleId: sale.id,
          },
        }),
        this.prisma.cashRegister.update({
          where: { id: openRegister.id },
          data: {
            totalSales: {
              increment: tipAmount,
            },
          },
        }),
      ]);
    }

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
      tipAmount,
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
      throw new BadRequestException('No se puede cerrar la cuenta, aÃºn hay saldo pendiente');
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

    await this.prisma.table.update({
      where: { id: table.id },
      data: {
        status: 'AVAILABLE',
        currentOrderId: null,
        currentDiners: 0,
        openedAt: null,
      },
    });

    await this.syncTableReservationStatus(table.id, branchId);

    return this.prisma.table.findUnique({
      where: { id: table.id },
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
        ...(status === 'PREPARING' || status === 'READY' ? { sentToKitchen: true, sentToKitchenAt: new Date() } : {}),
        ...(status === 'SERVED' ? { closedAt: new Date() } : {}),
      },
    });

    return this.getOrderAccount(order.id, branchId);
  }

  async getServiceRequests(
    branchId: string,
    status?: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED',
  ) {
    const where: any = { branchId };
    if (status) where.status = status;

    return this.prisma.tableServiceRequest.findMany({
      where,
      include: {
        table: {
          select: { id: true, number: true, sector: true },
        },
        order: {
          select: { id: true, orderNumber: true, status: true },
        },
        resolvedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: [{ status: 'asc' }, { requestedAt: 'asc' }],
      take: 300,
    });
  }

  async updateServiceRequestStatus(
    requestId: string,
    branchId: string,
    userId: string,
    status: 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED',
  ) {
    const request = await this.prisma.tableServiceRequest.findFirst({
      where: { id: requestId, branchId },
      select: { id: true, status: true },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const now = new Date();

    return this.prisma.tableServiceRequest.update({
      where: { id: request.id },
      data: {
        status: status as any,
        resolvedById: userId,
        ...(status === 'ACKNOWLEDGED' ? { acknowledgedAt: now } : {}),
        ...(status === 'RESOLVED' || status === 'CANCELLED' ? { resolvedAt: now } : {}),
      },
      include: {
        table: {
          select: { id: true, number: true, sector: true },
        },
        order: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
    });
  }

  private async resolvePublicTableToken(token: string) {
    const trimmedToken = String(token || '').trim();
    if (!trimmedToken) {
      throw new BadRequestException('Token de mesa invalido');
    }

    const table = await this.prisma.table.findFirst({
      where: {
        qrToken: trimmedToken,
        deletedAt: null,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            moduleType: true,
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Mesa no encontrada');
    }

    return table;
  }

  async getPublicTableMenu(token: string) {
    const table = await this.resolvePublicTableToken(token);

    const [products, activeOrder] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          branchId: table.branchId,
          deletedAt: null,
          status: 'ACTIVE',
        },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
      }),
      this.prisma.order.findFirst({
        where: {
          branchId: table.branchId,
          tableId: table.id,
          deletedAt: null,
          status: { in: ACTIVE_ORDER_STATUSES },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const categories = new Map<string, { id: string; name: string; items: any[] }>();
    for (const product of products) {
      const categoryId = product.categoryId;
      if (!categories.has(categoryId)) {
        categories.set(categoryId, {
          id: categoryId,
          name: product.category?.name || 'General',
          items: [],
        });
      }

      categories.get(categoryId)!.items.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        stock: Number(product.stock),
        available: Number(product.stock) > 0,
      });
    }

    return {
      branch: {
        id: table.branch.id,
        name: table.branch.name,
        moduleType: table.branch.moduleType,
      },
      table: {
        id: table.id,
        number: table.number,
        sector: table.sector,
        qrToken: table.qrToken,
      },
      menu: Array.from(categories.values()),
      activeOrder: activeOrder
        ? {
            id: activeOrder.id,
            orderNumber: activeOrder.orderNumber,
            status: activeOrder.status,
            diners: activeOrder.diners,
            sentToKitchen: activeOrder.sentToKitchen,
            sentToCashier: activeOrder.sentToCashier,
            items: activeOrder.items.map((item) => ({
              id: item.id,
              productName: item.product?.name || 'Producto',
              quantity: item.quantity,
              status: item.status,
              notes: item.notes,
            })),
          }
        : null,
      generatedAt: new Date().toISOString(),
    };
  }

  async getPublicOrderStatus(token: string) {
    const table = await this.resolvePublicTableToken(token);

    const [activeOrder, pendingRequests] = await Promise.all([
      this.prisma.order.findFirst({
        where: {
          branchId: table.branchId,
          tableId: table.id,
          deletedAt: null,
          status: { in: ACTIVE_ORDER_STATUSES },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tableServiceRequest.findMany({
        where: {
          branchId: table.branchId,
          tableId: table.id,
          status: { in: ['PENDING', 'ACKNOWLEDGED'] },
        },
        orderBy: { requestedAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      branch: {
        id: table.branch.id,
        name: table.branch.name,
      },
      table: {
        id: table.id,
        number: table.number,
        sector: table.sector,
        qrToken: table.qrToken,
      },
      order: activeOrder
        ? {
            id: activeOrder.id,
            orderNumber: activeOrder.orderNumber,
            status: activeOrder.status,
            createdAt: activeOrder.createdAt,
            sentToKitchen: activeOrder.sentToKitchen,
            sentToCashier: activeOrder.sentToCashier,
            items: activeOrder.items.map((item) => ({
              id: item.id,
              productName: item.product?.name || 'Producto',
              quantity: item.quantity,
              status: item.status,
              notes: item.notes,
              sentToKitchen: item.sentToKitchen,
            })),
          }
        : null,
      requests: pendingRequests.map((request) => ({
        id: request.id,
        type: request.type,
        status: request.status,
        message: request.message,
        requestedAt: request.requestedAt,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async createServiceRequestFromTable(
    token: string,
    data: { type: 'CONSULTATION' | 'BILL'; message?: string },
  ) {
    const table = await this.resolvePublicTableToken(token);
    const type = data?.type;

    if (!['CONSULTATION', 'BILL'].includes(type)) {
      throw new BadRequestException('Tipo de solicitud invalido');
    }

    const activeOrder = await this.prisma.order.findFirst({
      where: {
        branchId: table.branchId,
        tableId: table.id,
        deletedAt: null,
        status: { in: ACTIVE_ORDER_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const lastRequest = await this.prisma.tableServiceRequest.findFirst({
      where: {
        branchId: table.branchId,
        tableId: table.id,
        type: type as any,
        status: 'PENDING',
      },
      orderBy: { requestedAt: 'desc' },
      select: { id: true, requestedAt: true },
    });

    if (lastRequest) {
      const elapsedMs = Date.now() - new Date(lastRequest.requestedAt).getTime();
      if (elapsedMs < 90 * 1000) {
        return {
          id: lastRequest.id,
          message: 'Ya existe una solicitud pendiente reciente para esta mesa',
        };
      }
    }

    const request = await this.prisma.tableServiceRequest.create({
      data: {
        branchId: table.branchId,
        tableId: table.id,
        orderId: activeOrder?.id || null,
        type: type as any,
        status: 'PENDING',
        message: data?.message?.trim() || null,
      },
    });

    return {
      id: request.id,
      status: request.status,
      type: request.type,
      requestedAt: request.requestedAt,
      message: 'Solicitud enviada al garzon',
    };
  }

  async getOrderAccount(orderId: string, branchId: string) {
    const order = await this.ensureOrder(orderId, branchId);
    const taxRate = await this.getBranchTaxRate(branchId);
    const tipSuggestionPercent = await this.getBranchTipSuggestionPercent(branchId);

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
        sentToKitchen: item.sentToKitchen,
        sentAt: item.sentAt,
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
    const suggestedTipOnTotal = Math.round((total * tipSuggestionPercent) / 100);
    const suggestedTipOnRemaining = Math.round((remainingTotal * tipSuggestionPercent) / 100);

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
        sentToKitchen: order.sentToKitchen,
        sentToKitchenAt: order.sentToKitchenAt,
        sentToCashier: order.sentToCashier,
        sentToCashierAt: order.sentToCashierAt,
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
        tipSuggestionPercent,
        suggestedTipOnTotal,
        suggestedTipOnRemaining,
        totalWithSuggestedTipOnTotal: total + suggestedTipOnTotal,
        totalWithSuggestedTipOnRemaining: remainingTotal + suggestedTipOnRemaining,
      },
      isFullyPaid: remainingTotal <= 0,
    };
  }
}


