import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async getActivePromotions(branchId: string) {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        branchId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { comboProducts: true },
    });
  }

  async applyPromotion(promotionId: string, saleAmount: number) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id: promotionId } });

    if (promotion.discountType === 'PERCENTAGE') {
      return (saleAmount * Number(promotion.discountValue)) / 100;
    } else {
      return Number(promotion.discountValue);
    }
  }
}
