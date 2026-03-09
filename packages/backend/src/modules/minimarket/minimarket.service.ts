import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MinimarketService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(branchId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const [sales, products, registers] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          branchId,
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
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
      }),
      this.prisma.product.findMany({
        where: {
          branchId,
          deletedAt: null,
          status: 'ACTIVE',
          minStock: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          minStock: true,
        },
      }),
      this.prisma.cashRegister.findMany({
        where: {
          branchId,
          openedAt: { gte: start, lte: end },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    const topProductsMap = sales.reduce((acc, sale) => {
      sale.items.forEach((item) => {
        const key = item.productId;
        if (!acc[key]) {
          acc[key] = {
            productId: key,
            name: item.product?.name || 'Producto',
            quantity: 0,
            amount: 0,
          };
        }

        acc[key].quantity += Number(item.quantity);
        acc[key].amount += Number(item.total);
      });
      return acc;
    }, {} as Record<string, { productId: string; name: string; quantity: number; amount: number }>);

    const salesByCashier = sales.reduce((acc, sale) => {
      const key = sale.userId;
      const name = sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'Sin usuario';
      if (!acc[key]) {
        acc[key] = {
          userId: key,
          name,
          role: sale.user?.role || 'CASHIER',
          count: 0,
          amount: 0,
        };
      }

      acc[key].count += 1;
      acc[key].amount += Number(sale.total);
      return acc;
    }, {} as Record<string, { userId: string; name: string; role: string; count: number; amount: number }>);

    const criticalStock = products
      .filter((product) => Number(product.stock) <= Number(product.minStock))
      .map((product) => ({
        ...product,
        stock: Number(product.stock),
        minStock: Number(product.minStock),
        suggestedReorder: Math.max(Math.ceil(Number(product.minStock) * 2 - Number(product.stock)), 1),
      }))
      .sort((a, b) => a.stock - b.stock);

    return {
      sales: {
        count: sales.length,
        amount: totalSales,
        averageTicket: sales.length > 0 ? totalSales / sales.length : 0,
      },
      topProducts: Object.values(topProductsMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8),
      stock: {
        criticalCount: criticalStock.length,
        criticalItems: criticalStock.slice(0, 12),
      },
      cash: {
        openRegisters: registers.filter((register) => register.status === 'OPEN').length,
        closedRegisters: registers.filter((register) => register.status === 'CLOSED').length,
        registers,
      },
      salesByCashier: Object.values(salesByCashier).sort((a, b) => b.amount - a.amount),
      generatedAt: new Date(),
    };
  }

  async getQuickSaleContext(branchId: string) {
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const [recentSales, lowStock] = await Promise.all([
      this.prisma.saleItem.findMany({
        where: {
          sale: {
            branchId,
            status: 'COMPLETED',
            createdAt: { gte: start },
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              price: true,
              stock: true,
            },
          },
        },
      }),
      this.prisma.product.findMany({
        where: {
          branchId,
          deletedAt: null,
          status: 'ACTIVE',
          minStock: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
        },
      }),
    ]);

    const fastMoving = recentSales.reduce((acc, item) => {
      if (!item.product) return acc;

      const key = item.productId;
      if (!acc[key]) {
        acc[key] = {
          productId: key,
          name: item.product.name,
          sku: item.product.sku,
          barcode: item.product.barcode,
          price: Number(item.product.price),
          units: 0,
          stock: Number(item.product.stock),
        };
      }

      acc[key].units += Number(item.quantity);
      return acc;
    }, {} as Record<string, { productId: string; name: string; sku: string; barcode?: string | null; price: number; units: number; stock: number }>);

    return {
      fastMovingProducts: Object.values(fastMoving)
        .sort((a, b) => b.units - a.units)
        .slice(0, 10),
      criticalStock: lowStock
        .filter((product) => Number(product.stock) <= Number(product.minStock))
        .sort((a, b) => Number(a.stock) - Number(b.stock))
        .slice(0, 10),
      generatedAt: new Date(),
    };
  }
}
