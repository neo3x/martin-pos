import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async createDeliveryOrder(data: any, branchId: string) {
    const orderNumber = await this.generateOrderNumber();

    return this.prisma.deliveryOrder.create({
      data: {
        orderNumber,
        provider: data.provider,
        externalId: data.externalId,
        status: 'PENDING',
        deliveryFee: data.deliveryFee || 0,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        branchId,
        orderId: data.orderId,
      },
    });
  }

  async updateStatus(deliveryId: string, status: string) {
    const updateData: any = { status };

    if (status === 'ASSIGNED') updateData.assignedAt = new Date();
    if (status === 'PICKED_UP') updateData.pickedUpAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();

    return this.prisma.deliveryOrder.update({
      where: { id: deliveryId },
      data: updateData,
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const last = await this.prisma.deliveryOrder.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!last) return `DEL-00001`;
    const seq = parseInt(last.orderNumber.split('-')[1]) + 1;
    return `DEL-${seq.toString().padStart(5, '0')}`;
  }
}
