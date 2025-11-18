import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  async open(userId: string, branchId: string, initialCash: number) {
    // Check if there's already an open register
    const openRegister = await this.prisma.cashRegister.findFirst({
      where: { branchId, userId, status: 'OPEN' },
    });

    if (openRegister) {
      throw new BadRequestException('Cash register already open');
    }

    return this.prisma.cashRegister.create({
      data: {
        userId,
        branchId,
        initialCash,
        status: 'OPEN',
      },
    });
  }

  async close(registerId: string, finalCash: number) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: registerId },
      include: { transactions: true },
    });

    const totalSales = register.transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = register.transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expectedCash = Number(register.initialCash) + totalSales - totalExpenses;
    const difference = finalCash - expectedCash;

    return this.prisma.cashRegister.update({
      where: { id: registerId },
      data: {
        finalCash,
        expectedCash,
        difference,
        totalSales,
        totalExpenses,
        closedAt: new Date(),
        status: 'CLOSED',
      },
    });
  }

  async getCurrentRegister(userId: string, branchId: string) {
    return this.prisma.cashRegister.findFirst({
      where: { userId, branchId, status: 'OPEN' },
      include: { transactions: true },
    });
  }
}
