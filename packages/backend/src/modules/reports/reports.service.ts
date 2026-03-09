import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ModuleType } from '@martin-pos/shared';

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
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
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

    for (const sale of sales) {
      for (const item of sale.items) {
        const current = productTotals.get(item.productId) || {
          id: item.productId,
          name: item.product?.name || 'Producto',
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

    const byEmployee = sales.reduce((acc, sale) => {
      const key = sale.userId;
      const name = sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'Sin usuario';
      if (!acc[key]) {
        acc[key] = {
          userId: key,
          name,
          role: sale.user?.role || 'CASHIER',
          count: 0,
          revenue: 0,
        };
      }

      acc[key].count += 1;
      acc[key].revenue += Number(sale.total);
      return acc;
    }, {} as Record<string, { userId: string; name: string; role: string; count: number; revenue: number }>);

    const byCategory = sales.reduce((acc, sale) => {
      sale.items.forEach((item) => {
        const categoryName = item.product?.category?.name || 'Sin categoria';
        if (!acc[categoryName]) {
          acc[categoryName] = { category: categoryName, quantity: 0, revenue: 0 };
        }

        acc[categoryName].quantity += Number(item.quantity || 0);
        acc[categoryName].revenue += Number(item.total || 0);
      });
      return acc;
    }, {} as Record<string, { category: string; quantity: number; revenue: number }>);

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    return {
      totalSales: sales.length,
      totalRevenue,
      totalItems: sales.reduce((sum, sale) => sum + sale.items.length, 0),
      averageTicket: totalRevenue / (sales.length || 1),
      byPaymentMethod,
      byEmployee: Object.values(byEmployee).sort((a, b) => b.revenue - a.revenue),
      byCategory: Object.values(byCategory).sort((a, b) => b.revenue - a.revenue),
      topProducts,
      sales,
    };
  }

  async getModuleReport(branchId: string, dateFrom: Date, dateTo: Date) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { moduleType: true, name: true },
    });

    const moduleType = (branch?.moduleType || ModuleType.MINIMARKET) as ModuleType;
    const salesReport = await this.getSalesReport(branchId, dateFrom, dateTo);

    const cashTransactions = await this.prisma.cashTransaction.findMany({
      where: {
        cashRegister: {
          branchId,
        },
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
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

    const cashByEmployee = cashTransactions.reduce((acc, tx) => {
      const key = tx.userId;
      const name = tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : 'Sin usuario';
      if (!acc[key]) {
        acc[key] = {
          userId: key,
          name,
          role: tx.user?.role || 'CASHIER',
          incomes: 0,
          expenses: 0,
          movements: 0,
        };
      }

      acc[key].movements += 1;
      if (tx.type === 'INCOME') {
        acc[key].incomes += Number(tx.amount);
      } else {
        acc[key].expenses += Number(tx.amount);
      }

      return acc;
    }, {} as Record<string, { userId: string; name: string; role: string; incomes: number; expenses: number; movements: number }>);

    const moduleKpis = await this.getModuleKpis(branchId, moduleType, dateFrom, dateTo);

    return {
      moduleType,
      branchName: branch?.name || 'Sucursal',
      range: { from: dateFrom, to: dateTo },
      sales: salesReport,
      cashByEmployee: Object.values(cashByEmployee).sort((a, b) => b.incomes - a.incomes),
      moduleKpis,
      generatedAt: new Date(),
    };
  }

  private async getModuleKpis(branchId: string, moduleType: ModuleType, dateFrom: Date, dateTo: Date) {
    if (moduleType === ModuleType.RESTAURANT) {
      const [tables, orders] = await Promise.all([
        this.prisma.table.findMany({
          where: { branchId, deletedAt: null },
          select: { id: true, status: true },
        }),
        this.prisma.order.findMany({
          where: {
            branchId,
            createdAt: { gte: dateFrom, lte: dateTo },
          },
          select: { id: true, status: true, diners: true },
        }),
      ]);

      return {
        tables: {
          total: tables.length,
          occupied: tables.filter((table) => table.status === 'OCCUPIED').length,
          reserved: tables.filter((table) => table.status === 'RESERVED').length,
        },
        orders: {
          opened: orders.filter((order) => ['PENDING', 'PREPARING'].includes(order.status)).length,
          ready: orders.filter((order) => order.status === 'READY').length,
          served: orders.filter((order) => order.status === 'SERVED').length,
          averageDiners: orders.length > 0 ? orders.reduce((sum, order) => sum + Number(order.diners || 0), 0) / orders.length : 0,
        },
      };
    }

    if (moduleType === ModuleType.MINIMARKET) {
      const lowStock = await this.prisma.product.findMany({
        where: {
          branchId,
          deletedAt: null,
          status: 'ACTIVE',
          minStock: { gt: 0 },
        },
        select: { id: true, stock: true, minStock: true },
      });

      return {
        stockCritical: lowStock.filter((product) => Number(product.stock) <= Number(product.minStock)).length,
      };
    }

    if (moduleType === ModuleType.BOTILLERIA) {
      const [alcoholSalesItems, activePromotions] = await Promise.all([
        this.prisma.saleItem.findMany({
          where: {
            sale: {
              branchId,
              status: 'COMPLETED',
              createdAt: { gte: dateFrom, lte: dateTo },
            },
          },
          select: {
            productId: true,
            quantity: true,
          },
        }),
        this.prisma.promotion.count({
          where: {
            branchId,
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
            type: { in: ['COMBO', 'DISCOUNT'] },
          },
        }),
      ]);

      const productIds = Array.from(new Set(alcoholSalesItems.map((item) => item.productId)));
      const alcoholProducts = productIds.length
        ? await this.prisma.alcoholicProduct.findMany({
            where: { productId: { in: productIds } },
            select: { productId: true, category: true },
          })
        : [];

      const categoryByProductId = new Map(alcoholProducts.map((item) => [item.productId, item.category]));
      const topCategories = alcoholSalesItems.reduce((acc, item) => {
        const category = categoryByProductId.get(item.productId);
        if (!category) return acc;
        if (!acc[category]) {
          acc[category] = { category, units: 0 };
        }
        acc[category].units += Number(item.quantity || 0);
        return acc;
      }, {} as Record<string, { category: string; units: number }>);

      return {
        activePromotions,
        topAlcoholCategories: Object.values(topCategories).sort((a, b) => b.units - a.units).slice(0, 5),
      };
    }

    if (moduleType === ModuleType.BOOKSTORE) {
      const campaigns = await this.prisma.promotion.findMany({
        where: {
          branchId,
          isActive: true,
          type: { in: ['SEASONAL', 'COMBO', 'DISCOUNT'] },
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
        select: {
          id: true,
          name: true,
          type: true,
          endDate: true,
        },
      });

      return {
        activeCampaigns: campaigns,
      };
    }

    return {};
  }
}


