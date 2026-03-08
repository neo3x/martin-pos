import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  // Clock in
  async clockIn(userId: string) {
    const activeShift = await this.prisma.employeeShift.findFirst({
      where: { userId, endTime: null },
    });

    if (activeShift) {
      throw new Error('Ya hay un turno activo');
    }

    return this.prisma.employeeShift.create({
      data: {
        userId,
        startTime: new Date(),
      },
    });
  }

  // Clock out
  async clockOut(userId: string) {
    const activeShift = await this.prisma.employeeShift.findFirst({
      where: { userId, endTime: null },
      orderBy: { startTime: 'desc' },
    });

    if (!activeShift) {
      throw new Error('No hay turno activo');
    }

    const endTime = new Date();
    const totalHours = (endTime.getTime() - activeShift.startTime.getTime()) / (1000 * 60 * 60);

    return this.prisma.employeeShift.update({
      where: { id: activeShift.id },
      data: {
        endTime,
        totalHours,
      },
    });
  }

  // Get employee shifts
  async getShifts(userId: string, dateFrom?: Date, dateTo?: Date) {
    return this.prisma.employeeShift.findMany({
      where: {
        userId,
        ...(dateFrom && dateTo && {
          startTime: { gte: dateFrom, lte: dateTo },
        }),
      },
      orderBy: { startTime: 'desc' },
    });
  }

  // Calculate commission for sale
  async calculateCommission(userId: string, saleId: string, saleAmount: number) {
    // Default 3% commission, can be customized per user
    const percentage = 3;
    const amount = (saleAmount * percentage) / 100;

    return this.prisma.commission.create({
      data: {
        userId,
        saleId,
        amount,
        percentage,
        baseSaleAmount: saleAmount,
      },
    });
  }

  // Get employee commissions
  async getCommissions(userId: string, dateFrom?: Date, dateTo?: Date) {
    return this.prisma.commission.findMany({
      where: {
        userId,
        ...(dateFrom && dateTo && {
          createdAt: { gte: dateFrom, lte: dateTo },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get employee performance metrics
  async getPerformanceMetrics(userId: string, dateFrom: Date, dateTo: Date) {
    const sales = await this.prisma.sale.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        createdAt: { gte: dateFrom, lte: dateTo },
      },
    });

    const shifts = await this.getShifts(userId, dateFrom, dateTo);
    const commissions = await this.getCommissions(userId, dateFrom, dateTo);

    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalHours = shifts.reduce((sum, shift) => sum + Number(shift.totalHours || 0), 0);
    const totalCommissions = commissions.reduce((sum, comm) => sum + Number(comm.amount), 0);

    return {
      totalSales,
      salesCount: sales.length,
      averageSale: sales.length > 0 ? totalSales / sales.length : 0,
      totalHours,
      totalCommissions,
      salesPerHour: totalHours > 0 ? sales.length / totalHours : 0,
    };
  }
}
