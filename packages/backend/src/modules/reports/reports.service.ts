import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(branchId: string, dateFrom: Date, dateTo: Date) {
    const sales = await this.prisma.sale.findMany({
      where: {
        branchId,
        status: 'COMPLETED',
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      include: { items: true },
    });

    return {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + Number(s.total), 0),
      totalItems: sales.reduce((sum, s) => sum + s.items.length, 0),
      averageTicket: sales.reduce((sum, s) => sum + Number(s.total), 0) / (sales.length || 1),
      sales,
    };
  }
}
