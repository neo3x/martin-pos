import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LayawayService {
  constructor(private prisma: PrismaService) {}

  async createLayaway(data: any) {
    const layawayNumber = await this.generateLayawayNumber();
    const totalAmount = data.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);

    return this.prisma.layaway.create({
      data: {
        layawayNumber,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: 'ACTIVE',
        dueDate: data.dueDate,
        customerId: data.customerId,
        notes: data.notes,
        items: { create: data.items },
      },
      include: { items: true },
    });
  }

  async addPayment(layawayId: string, amount: number, paymentMethod: string) {
    const layaway = await this.prisma.layaway.findUnique({ where: { id: layawayId } });
    const newPaidAmount = Number(layaway.paidAmount) + amount;
    const newRemainingAmount = Number(layaway.totalAmount) - newPaidAmount;

    await this.prisma.layawayPayment.create({
      data: { layawayId, amount, paymentMethod: paymentMethod as any },
    });

    return this.prisma.layaway.update({
      where: { id: layawayId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newRemainingAmount <= 0 ? 'COMPLETED' : 'ACTIVE',
      },
    });
  }

  private async generateLayawayNumber(): Promise<string> {
    const last = await this.prisma.layaway.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!last) return `LAY-00001`;
    const seq = parseInt(last.layawayNumber.split('-')[1]) + 1;
    return `LAY-${seq.toString().padStart(5, '0')}`;
  }
}
