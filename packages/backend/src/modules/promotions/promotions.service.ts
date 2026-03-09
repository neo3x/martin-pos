import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async getActivePromotions(branchId: string) {
    const now = new Date();
    const promotions = await this.prisma.promotion.findMany({
      where: {
        branchId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { comboProducts: true },
    });

    const productIds = Array.from(
      new Set(promotions.flatMap((promotion) => promotion.comboProducts.map((combo) => combo.productId)))
    );
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, price: true, sku: true },
        })
      : [];
    const productMap = new Map(products.map((product) => [product.id, product]));

    return promotions.map((promotion) => ({
      ...promotion,
      comboProducts: promotion.comboProducts.map((combo) => ({
        ...combo,
        product: productMap.get(combo.productId) || null,
      })),
    }));
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


