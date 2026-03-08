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

    const byPaymentMethod = sales.reduce((acc, sale) => {
      const method = sale.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count += 1;
      acc[method].total += Number(sale.total);
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    const productTotals = new Map<string, { id: string; name: string; quantity: number; revenue: number }>();
    const productIds = Array.from(new Set(sales.flatMap((sale) => sale.items.map((item) => item.productId))));
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productNameMap = new Map(products.map((p) => [p.id, p.name]));

    for (const sale of sales) {
      for (const item of sale.items) {
        const current = productTotals.get(item.productId) || {
          id: item.productId,
          name: productNameMap.get(item.productId) || 'Producto',
          quantity: 0,
          revenue: 0,
        };
        current.quantity += Number(item.quantity);
        current.revenue += Number(item.total);
        productTotals.set(item.productId, current);
      }
    }

    const topProducts = Array.from(productTotals.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + Number(s.total), 0),
      totalItems: sales.reduce((sum, s) => sum + s.items.length, 0),
      averageTicket: sales.reduce((sum, s) => sum + Number(s.total), 0) / (sales.length || 1),
      byPaymentMethod,
      topProducts,
      sales,
    };
  }
}
