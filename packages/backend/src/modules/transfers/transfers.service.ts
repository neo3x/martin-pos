import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TransfersService {
  constructor(private prisma: PrismaService) {}

  async createTransfer(data: any, createdById: string) {
    const lastTransfer = await this.prisma.inventoryTransfer.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const transferNumber = this.generateTransferNumber(lastTransfer?.transferNumber);

    return this.prisma.inventoryTransfer.create({
      data: {
        transferNumber,
        fromBranchId: data.fromBranchId,
        toBranchId: data.toBranchId,
        createdById,
        status: 'PENDING',
        items: {
          create: data.items,
        },
      },
      include: { items: true },
    });
  }

  async sendTransfer(transferId: string) {
    const transfer = await this.prisma.inventoryTransfer.findUnique({
      where: { id: transferId },
      include: { items: true },
    });

    // Reduce stock from origin branch
    await this.prisma.$transaction(
      transfer.items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );

    return this.prisma.inventoryTransfer.update({
      where: { id: transferId },
      data: { status: 'IN_TRANSIT', sentAt: new Date() },
    });
  }

  async receiveTransfer(transferId: string) {
    const transfer = await this.prisma.inventoryTransfer.findUnique({
      where: { id: transferId },
      include: { items: true },
    });

    // Add stock to destination branch
    await this.prisma.$transaction(
      transfer.items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      )
    );

    return this.prisma.inventoryTransfer.update({
      where: { id: transferId },
      data: { status: 'RECEIVED', receivedAt: new Date() },
    });
  }

  private generateTransferNumber(lastNumber?: string): string {
    if (!lastNumber) return `TRF-${new Date().getFullYear()}-00001`;
    const parts = lastNumber.split('-');
    const seq = parseInt(parts[2]) + 1;
    return `TRF-${new Date().getFullYear()}-${seq.toString().padStart(5, '0')}`;
  }
}
