import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async getTables(branchId: string) {
    return this.prisma.table.findMany({
      where: { branchId, deletedAt: null },
      include: { orders: { where: { status: { not: 'SERVED' } } } },
    });
  }

  async createOrder(data: any, branchId: string, waiterId?: string) {
    const lastOrder = await this.prisma.order.findFirst({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
    });

    const orderNumber = this.generateOrderNumber(lastOrder?.orderNumber);

    return this.prisma.order.create({
      data: {
        orderNumber,
        branchId,
        tableId: data.tableId,
        waiterId,
        status: 'PENDING',
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes,
            status: 'PENDING',
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    });
  }

  private generateOrderNumber(lastOrderNumber?: string): string {
    if (!lastOrderNumber) return `ORD-001`;
    const num = parseInt(lastOrderNumber.split('-')[1]) + 1;
    return `ORD-${num.toString().padStart(3, '0')}`;
  }
}
