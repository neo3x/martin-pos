import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  // Create or get loyalty program
  async getProgramByBranch(branchId: string) {
    let program = await this.prisma.loyaltyProgram.findFirst({
      where: { branchId, isActive: true },
    });

    if (!program) {
      program = await this.prisma.loyaltyProgram.create({
        data: {
          name: 'Programa de Lealtad',
          pointsPerDollar: 1,
          dollarPerPoint: 0.01,
          minPointsToRedeem: 100,
          branchId,
        },
      });
    }

    return program;
  }

  // Award points for purchase
  async awardPoints(customerId: string, saleAmount: number, branchId: string) {
    const program = await this.getProgramByBranch(branchId);
    const points = Math.floor(Number(saleAmount) * Number(program.pointsPerDollar));

    await this.prisma.loyaltyTransaction.create({
      data: {
        customerId,
        programId: program.id,
        points,
        type: 'EARNED',
        description: `Puntos ganados por compra de $${saleAmount}`,
      },
    });

    // Update customer total points
    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: {
          increment: points,
        },
      },
    });

    return { points, totalPoints: await this.getCustomerPoints(customerId) };
  }

  // Redeem points
  async redeemPoints(customerId: string, points: number, branchId: string) {
    const program = await this.getProgramByBranch(branchId);
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    if (customer.loyaltyPoints < points) {
      throw new Error('Insufficient points');
    }

    if (points < program.minPointsToRedeem) {
      throw new Error(`Minimum ${program.minPointsToRedeem} points required to redeem`);
    }

    const discountAmount = Number(points) * Number(program.dollarPerPoint);

    await this.prisma.loyaltyTransaction.create({
      data: {
        customerId,
        programId: program.id,
        points: -points,
        type: 'REDEEMED',
        description: `${points} puntos canjeados por $${discountAmount} de descuento`,
      },
    });

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: {
          decrement: points,
        },
      },
    });

    return { discountAmount, remainingPoints: customer.loyaltyPoints - points };
  }

  // Get customer points
  async getCustomerPoints(customerId: string): Promise<number> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    return customer?.loyaltyPoints || 0;
  }

  // Get customer transactions
  async getCustomerTransactions(customerId: string) {
    return this.prisma.loyaltyTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // AI-based personalized discounts
  async getPersonalizedDiscounts(customerId: string) {
    const preferences = await this.prisma.customerPreference.findMany({
      where: { customerId },
      orderBy: { frequency: 'desc' },
      take: 5,
    });

    // TODO: Use AI to generate personalized discount suggestions
    return preferences.map((pref) => ({
      productId: pref.productId,
      categoryId: pref.categoryId,
      suggestedDiscount: 10 + Math.floor(pref.frequency / 10), // Simple logic, can be enhanced with AI
    }));
  }
}
