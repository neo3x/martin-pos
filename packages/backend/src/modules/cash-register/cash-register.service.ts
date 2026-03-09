import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

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

  async close(registerId: string, finalCash: number, userId: string, requesterRole?: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: registerId },
      include: { transactions: true },
    });

    if (!register) {
      throw new NotFoundException('Caja no encontrada');
    }

    if (register.status === 'CLOSED') {
      throw new BadRequestException('La caja ya esta cerrada');
    }

    const canCloseForeignRegister = requesterRole ? MANAGER_ROLES.includes(requesterRole) : false;
    if (register.userId !== userId && !canCloseForeignRegister) {
      throw new ForbiddenException('Solo el usuario que abrio la caja puede cerrarla');
    }

    if (finalCash < 0) {
      throw new BadRequestException('El monto final no puede ser negativo');
    }

    const incomeBreakdown = this.computeIncomeBreakdown(register.transactions);
    const totalIncome = incomeBreakdown.salesIncome + incomeBreakdown.tipsIncome + incomeBreakdown.otherIncome;

    const totalExpenses = register.transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expectedCash = Number(register.initialCash) + totalIncome - totalExpenses;
    const difference = finalCash - expectedCash;

    const closed = await this.prisma.cashRegister.update({
      where: { id: registerId },
      data: {
        finalCash,
        expectedCash,
        difference,
        totalSales: incomeBreakdown.salesIncome,
        totalExpenses,
        closedAt: new Date(),
        status: 'CLOSED',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          role: true,
          },
        },
      },
    });

    this.logger.log(
      `Cash register closed: ${registerId} by user ${userId}. Expected: $${expectedCash}, Final: $${finalCash}, Diff: $${difference}`
    );

    return closed;
  }

  async createMovement(
    registerId: string,
    branchId: string,
    userId: string,
    requesterRole: string,
    data: {
      type: 'INCOME' | 'EXPENSE';
      paymentMethod: string;
      amount: number;
      description: string;
    }
  ) {
    const register = await this.prisma.cashRegister.findFirst({
      where: {
        id: registerId,
        branchId,
      },
    });

    if (!register) {
      throw new NotFoundException('Caja no encontrada');
    }

    if (register.status !== 'OPEN') {
      throw new BadRequestException('Solo se pueden registrar movimientos en una caja abierta');
    }

    const canOperate = register.userId === userId || MANAGER_ROLES.includes(requesterRole);
    if (!canOperate) {
      throw new ForbiddenException('No tiene permisos para registrar movimientos en esta caja');
    }

    const amount = Number(data.amount || 0);
    if (amount <= 0) {
      throw new BadRequestException('El monto del movimiento debe ser mayor a cero');
    }

    const [transaction] = await this.prisma.$transaction([
      this.prisma.cashTransaction.create({
        data: {
          cashRegisterId: register.id,
          userId,
          type: data.type,
          category: 'OTHER',
          paymentMethod: data.paymentMethod as any,
          amount,
          description: data.description,
        },
      }),
      this.prisma.cashRegister.update({
        where: { id: register.id },
        data: {
          ...(data.type === 'EXPENSE'
            ? {
                totalExpenses: {
                  increment: amount,
                },
              }
            : {}),
        },
      }),
    ]);

    return transaction;
  }

  async getCurrentRegister(userId: string, branchId: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { userId, branchId, status: 'OPEN' },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!register) {
      return null;
    }

    return this.computeRegisterMetrics(register);
  }

  async getHistory(branchId: string, filters?: { from?: Date; to?: Date; limit?: number }) {
    const registers = await this.prisma.cashRegister.findMany({
      where: {
        branchId,
        ...(filters?.from && filters?.to
          ? {
              openedAt: {
                gte: filters.from,
                lte: filters.to,
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        transactions: true,
      },
      orderBy: { openedAt: 'desc' },
      take: filters?.limit || 30,
    });

    return registers.map((register) => this.computeRegisterMetrics(register));
  }

  async getShiftSummary(branchId: string, filters?: { from?: Date; to?: Date }) {
    const registers = await this.prisma.cashRegister.findMany({
      where: {
        branchId,
        ...(filters?.from && filters?.to
          ? {
              openedAt: {
                gte: filters.from,
                lte: filters.to,
              },
            }
          : {}),
      },
      include: {
        transactions: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { openedAt: 'desc' },
    });

    const normalized = registers.map((register) => this.computeRegisterMetrics(register));

    const salesByCashier = normalized.reduce((acc, register) => {
      const key = register.userId;
      const name = register.user ? `${register.user.firstName} ${register.user.lastName}` : 'Sin usuario';
      if (!acc[key]) {
        acc[key] = {
          userId: key,
          name,
          role: register.user?.role || 'CASHIER',
          shifts: 0,
          sales: 0,
          tips: 0,
          otherIncome: 0,
          expenses: 0,
          difference: 0,
        };
      }

      acc[key].shifts += 1;
      acc[key].sales += Number(register.salesIncome || 0);
      acc[key].tips += Number(register.tipsIncome || 0);
      acc[key].otherIncome += Number(register.otherIncome || 0);
      acc[key].expenses += Number(register.expenseTotal || 0);
      acc[key].difference += Number(register.difference || 0);
      return acc;
    }, {} as Record<string, { userId: string; name: string; role: string; shifts: number; sales: number; tips: number; otherIncome: number; expenses: number; difference: number }>);

    return {
      totalShifts: normalized.length,
      openShifts: normalized.filter((register) => register.status === 'OPEN').length,
      closedShifts: normalized.filter((register) => register.status === 'CLOSED').length,
      totalIncome: normalized.reduce((sum, register) => sum + Number(register.incomeTotal || 0), 0),
      totalSalesIncome: normalized.reduce((sum, register) => sum + Number(register.salesIncome || 0), 0),
      totalTipsIncome: normalized.reduce((sum, register) => sum + Number(register.tipsIncome || 0), 0),
      totalOtherIncome: normalized.reduce((sum, register) => sum + Number(register.otherIncome || 0), 0),
      totalExpenses: normalized.reduce((sum, register) => sum + Number(register.expenseTotal || 0), 0),
      totalDifference: normalized.reduce((sum, register) => sum + Number(register.difference || 0), 0),
      salesByCashier: Object.values(salesByCashier as any).sort((a: any, b: any) => b.sales - a.sales),
      shifts: normalized,
    };
  }

  private computeRegisterMetrics(register: any) {
    const cashSales = register.transactions
      .filter((tx: any) => tx.type === 'INCOME' && tx.paymentMethod === 'CASH')
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    const incomeBreakdown = this.computeIncomeBreakdown(register.transactions);
    const incomeTotal = incomeBreakdown.salesIncome + incomeBreakdown.tipsIncome + incomeBreakdown.otherIncome;

    const expenseTotal = register.transactions
      .filter((tx: any) => tx.type === 'EXPENSE')
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    const expectedCash = Number(register.initialCash || 0) + incomeTotal - expenseTotal;

    return {
      ...register,
      transactionCount: register.transactions.length,
      cashSales,
      salesIncome: incomeBreakdown.salesIncome,
      tipsIncome: incomeBreakdown.tipsIncome,
      otherIncome: incomeBreakdown.otherIncome,
      incomeTotal,
      expenseTotal,
      expectedCash,
      difference:
        register.status === 'CLOSED'
          ? Number(register.difference || 0)
          : Number(register.finalCash || expectedCash) - expectedCash,
    };
  }

  private computeIncomeBreakdown(transactions: any[]) {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.type !== 'INCOME') return acc;
        const category = String(tx.category || 'OTHER').toUpperCase();
        if (category === 'TIP') {
          acc.tipsIncome += Number(tx.amount || 0);
        } else if (category === 'SALE') {
          acc.salesIncome += Number(tx.amount || 0);
        } else {
          acc.otherIncome += Number(tx.amount || 0);
        }
        return acc;
      },
      {
        salesIncome: 0,
        tipsIncome: 0,
        otherIncome: 0,
      },
    );
  }
}


