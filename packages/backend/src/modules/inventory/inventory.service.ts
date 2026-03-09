import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductStatus } from '@martin-pos/shared';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStockMovements(branchId: string, filters?: any) {
    return this.prisma.stockMovement.findMany({
      where: {
        branchId,
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.type && { type: filters.type }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: {
              select: { id: true, name: true },
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
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });
  }

  async getAlerts(branchId: string) {
    return this.prisma.inventoryAlert.findMany({
      where: { branchId, isRead: false },
      include: { product: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getCriticalStock(branchId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        branchId,
        deletedAt: null,
        status: ProductStatus.ACTIVE,
        minStock: { gt: 0 },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const lowStockProducts = products.filter((product) => Number(product.stock) <= Number(product.minStock));

    if (!lowStockProducts.length) {
      return {
        totalCritical: 0,
        items: [],
      };
    }

    const productIds = lowStockProducts.map((product) => product.id);
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const recentSaleItems = await this.prisma.saleItem.findMany({
      where: {
        productId: { in: productIds },
        sale: {
          branchId,
          status: 'COMPLETED',
          createdAt: {
            gte: since,
          },
        },
      },
      select: {
        productId: true,
        quantity: true,
      },
    });

    const soldByProduct = recentSaleItems.reduce((acc, item) => {
      acc[item.productId] = (acc[item.productId] || 0) + Number(item.quantity || 0);
      return acc;
    }, {} as Record<string, number>);

    const items = lowStockProducts
      .map((product) => {
        const soldLast14Days = Number(soldByProduct[product.id] || 0);
        const avgDailySales = soldLast14Days / 14;
        const stock = Number(product.stock);
        const minStock = Number(product.minStock);
        const daysCoverage = avgDailySales > 0 ? stock / avgDailySales : null;
        const suggestedReorder = Math.max(Math.ceil(minStock * 2 - stock), Math.ceil(avgDailySales * 7), 1);

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category?.name || null,
          stock,
          minStock,
          avgDailySales: Number(avgDailySales.toFixed(2)),
          daysCoverage: daysCoverage !== null ? Number(daysCoverage.toFixed(1)) : null,
          suggestedReorder,
        };
      })
      .sort((a, b) => {
        const aCoverage = a.daysCoverage ?? Number.POSITIVE_INFINITY;
        const bCoverage = b.daysCoverage ?? Number.POSITIVE_INFINITY;
        return aCoverage - bCoverage;
      });

    return {
      totalCritical: items.length,
      items,
    };
  }

  async getReplenishmentSuggestions(branchId: string) {
    const critical = await this.getCriticalStock(branchId);

    return {
      generatedAt: new Date(),
      totalSuggestions: critical.items.length,
      suggestions: critical.items.map((item) => ({
        productId: item.id,
        productName: item.name,
        sku: item.sku,
        currentStock: item.stock,
        minStock: item.minStock,
        suggestedQuantity: item.suggestedReorder,
        reason:
          item.daysCoverage !== null && item.daysCoverage <= 3
            ? 'Alta rotacion con cobertura menor o igual a 3 dias'
            : 'Stock bajo respecto al minimo configurado',
      })),
    };
  }

  async receiveStock(
    branchId: string,
    userId: string,
    data: { productId: string; quantity: number; unitCost?: number; reason?: string }
  ) {
    if (!data.productId) {
      throw new BadRequestException('Debe indicar el producto a recibir');
    }

    const quantity = Number(data.quantity || 0);
    if (quantity <= 0) {
      throw new BadRequestException('La cantidad de ingreso debe ser mayor a cero');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: data.productId,
          branchId,
          deletedAt: null,
        },
      });

      if (!product) {
        throw new NotFoundException('Producto no encontrado para la sucursal');
      }

      const previousStock = Number(product.stock);
      const newStock = previousStock + quantity;
      const unitCost = Number(data.unitCost ?? product.costPrice ?? 0);

      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: newStock,
          status: 'ACTIVE',
          ...(unitCost > 0 ? { costPrice: unitCost } : {}),
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          branchId,
          userId,
          productId: product.id,
          type: 'PURCHASE',
          quantity,
          previousStock,
          newStock,
          unitCost,
          totalCost: unitCost * quantity,
          reason: data.reason || 'Ingreso de mercaderia',
          inputMethod: 'MANUAL',
        },
      });

      return movement;
    });
  }

  async adjustStock(
    branchId: string,
    userId: string,
    data: { productId: string; newStock: number; reason?: string }
  ) {
    if (!data.productId) {
      throw new BadRequestException('Debe indicar el producto a ajustar');
    }

    const newStock = Number(data.newStock);
    if (!Number.isFinite(newStock) || newStock < 0) {
      throw new BadRequestException('El nuevo stock debe ser un numero mayor o igual a cero');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: data.productId,
          branchId,
          deletedAt: null,
        },
      });

      if (!product) {
        throw new NotFoundException('Producto no encontrado para la sucursal');
      }

      const previousStock = Number(product.stock);
      if (previousStock === newStock) {
        return {
          productId: product.id,
          previousStock,
          newStock,
          movement: null,
        };
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: newStock,
          status: newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          branchId,
          userId,
          productId: product.id,
          type: 'ADJUSTMENT',
          quantity: Math.abs(newStock - previousStock),
          previousStock,
          newStock,
          reason: data.reason || 'Ajuste de inventario',
          inputMethod: 'MANUAL',
        },
      });

      return {
        productId: product.id,
        previousStock,
        newStock,
        movement,
      };
    });
  }
}


