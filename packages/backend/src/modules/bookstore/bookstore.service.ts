import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BookstoreService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(branchId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const [sales, products, promotions] = await Promise.all([
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
      }),
      this.prisma.product.findMany({
        where: {
          branchId,
          deletedAt: null,
          status: 'ACTIVE',
          minStock: { gt: 0 },
        },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.promotion.findMany({
        where: {
          branchId,
          isActive: true,
          type: { in: ['SEASONAL', 'COMBO', 'DISCOUNT'] },
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
        orderBy: { endDate: 'asc' },
        take: 8,
      }),
    ]);

    const totalSalesAmount = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    const salesByCategory = sales.reduce((acc, sale) => {
      sale.items.forEach((item) => {
        const categoryName = item.product?.category?.name || 'Sin categoria';
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            quantity: 0,
            revenue: 0,
          };
        }

        acc[categoryName].quantity += Number(item.quantity || 0);
        acc[categoryName].revenue += Number(item.total || 0);
      });

      return acc;
    }, {} as Record<string, { category: string; quantity: number; revenue: number }>);

    const topSchoolProducts = Object.values(
      sales.reduce((acc, sale) => {
        sale.items.forEach((item) => {
          const category = item.product?.category?.name?.toLowerCase() || '';
          if (!category.includes('cuaderno') && !category.includes('escritura') && !category.includes('oficina')) {
            return;
          }

          const key = item.productId;
          if (!acc[key]) {
            acc[key] = {
              productId: key,
              name: item.product?.name || 'Producto',
              quantity: 0,
              revenue: 0,
            };
          }

          acc[key].quantity += Number(item.quantity || 0);
          acc[key].revenue += Number(item.total || 0);
        });

        return acc;
      }, {} as Record<string, { productId: string; name: string; quantity: number; revenue: number }>)
    )
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    const topBooks = Object.values(
      sales.reduce((acc, sale) => {
        sale.items.forEach((item) => {
          const category = item.product?.category?.name?.toLowerCase() || '';
          if (!category.includes('libro')) {
            return;
          }

          const key = item.productId;
          if (!acc[key]) {
            acc[key] = {
              productId: key,
              name: item.product?.name || 'Producto',
              quantity: 0,
              revenue: 0,
            };
          }

          acc[key].quantity += Number(item.quantity || 0);
          acc[key].revenue += Number(item.total || 0);
        });

        return acc;
      }, {} as Record<string, { productId: string; name: string; quantity: number; revenue: number }>)
    )
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    const salesBySeller = sales.reduce((acc, sale) => {
      const key = sale.userId;
      const label = sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'Sin usuario';
      if (!acc[key]) {
        acc[key] = {
          userId: key,
          name: label,
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
      .sort((a, b) => Number(a.stock) - Number(b.stock))
      .slice(0, 12)
      .map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category?.name || null,
        stock: Number(product.stock),
        minStock: Number(product.minStock),
      }));

    return {
      sales: {
        count: sales.length,
        amount: totalSalesAmount,
        averageTicket: sales.length > 0 ? totalSalesAmount / sales.length : 0,
      },
      categories: Object.values(salesByCategory)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
      topSchoolProducts,
      topBooks,
      salesBySeller: Object.values(salesBySeller).sort((a, b) => b.amount - a.amount),
      stock: {
        criticalCount: criticalStock.length,
        criticalItems: criticalStock,
      },
      campaigns: promotions,
      season: this.getCurrentAcademicSeason(),
      generatedAt: new Date(),
    };
  }

  async getCampaigns(branchId: string) {
    const now = new Date();
    const campaigns = await this.prisma.promotion.findMany({
      where: {
        branchId,
        isActive: true,
        type: { in: ['SEASONAL', 'COMBO', 'DISCOUNT'] },
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ type: 'asc' }, { endDate: 'asc' }],
    });

    return {
      activeCampaigns: campaigns,
      seasonalFocus: this.getCurrentAcademicSeason(),
      suggestedCampaigns: this.getSuggestedCampaigns(),
      generatedAt: new Date(),
    };
  }

  private getCurrentAcademicSeason() {
    const month = new Date().getMonth() + 1;

    if (month >= 2 && month <= 4) {
      return 'Temporada escolar alta';
    }

    if (month >= 7 && month <= 8) {
      return 'Refuerzo medio ano escolar';
    }

    if (month >= 11 || month <= 1) {
      return 'Temporada regalos y cierre de ano';
    }

    return 'Temporada regular de oficina y estudio';
  }

  private getSuggestedCampaigns() {
    const month = new Date().getMonth() + 1;

    if (month >= 2 && month <= 4) {
      return [
        'Combo escolar: cuaderno + lapiz + carpeta',
        'Pack oficina emprendedores',
        '2do libro infantil con descuento',
      ];
    }

    if (month >= 11 || month <= 1) {
      return [
        'Campana regalos de navidad',
        'Oferta packs de agenda y planners',
        'Promocion de liquidacion escolar',
      ];
    }

    return [
      'Campana lectura mensual',
      'Oferta de reposicion oficina',
      'Pack estudio universitario',
    ];
  }
}
