import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStockMovements(branchId: string, filters?: any) {
    return this.prisma.stockMovement.findMany({
      where: {
        branchId,
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.type && { type: filters.type }),
      },
      include: { product: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getAlerts(branchId: string) {
    return this.prisma.inventoryAlert.findMany({
      where: { branchId, isRead: false },
      include: { product: true },
      orderBy: { priority: 'desc' },
    });
  }
}
