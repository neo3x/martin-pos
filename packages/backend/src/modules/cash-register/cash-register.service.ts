import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CashRegisterService {
  private readonly logger = new Logger(CashRegisterService.name);

  constructor(private prisma: PrismaService) {}

  async open(userId: string, branchId: string, initialCash: number) {
    // Check if there's already an open register for this user
    const openRegister = await this.prisma.cashRegister.findFirst({
      where: { branchId, userId, status: 'OPEN' },
    });

    if (openRegister) {
      throw new BadRequestException('Ya tiene una caja abierta');
    }

    const register = await this.prisma.cashRegister.create({
      data: {
        userId,
        branchId,
        initialCash,
        status: 'OPEN',
      },
    });

    this.logger.log(`Cash register opened: ${register.id} by user ${userId} with initial cash $${initialCash}`);

    return register;
  }

  async close(registerId: string, finalCash: number, userId: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: registerId },
      include: { transactions: true },
    });

    if (!register) {
      throw new NotFoundException('Caja no encontrada');
    }

    if (register.status === 'CLOSED') {
      throw new BadRequestException('La caja ya está cerrada');
    }

    // Verify the user closing is the owner or an admin
    if (register.userId !== userId) {
      throw new ForbiddenException('Solo el usuario que abrió la caja puede cerrarla');
    }

    if (finalCash < 0) {
      throw new BadRequestException('El monto final no puede ser negativo');
    }

    const totalSales = register.transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = register.transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expectedCash = Number(register.initialCash) + totalSales - totalExpenses;
    const difference = finalCash - expectedCash;

    const closed = await this.prisma.cashRegister.update({
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

    this.logger.log(
      `Cash register closed: ${registerId} by user ${userId}. Expected: $${expectedCash}, Final: $${finalCash}, Diff: $${difference}`
    );

    return closed;
  }

  async getCurrentRegister(userId: string, branchId: string) {
    return this.prisma.cashRegister.findFirst({
      where: { userId, branchId, status: 'OPEN' },
      include: { transactions: true },
    });
  }
}
