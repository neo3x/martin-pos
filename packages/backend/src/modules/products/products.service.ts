import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IProductCreate, ProductStatus, InputMethod } from '@martin-pos/shared';
import { Prisma } from '@martin-pos/database';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId: string, filters?: any) {
    const where: Prisma.ProductWhereInput = {
      branchId,
      deletedAt: null,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { barcode: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        recipe: {
          include: {
            ingredients: {
              include: {
                product: true,
              },
            },
          },
        },
        productLots: {
          where: {
            quantity: { gt: 0 },
          },
          orderBy: {
            expirationDate: 'asc',
          },
        },
      },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByBarcode(barcode: string, branchId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        barcode,
        branchId,
        deletedAt: null,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySku(sku: string, branchId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        sku,
        branchId,
        deletedAt: null,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(data: IProductCreate & { branchId: string }) {
    // Check if SKU or barcode already exists
    if (data.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: {
          barcode: data.barcode,
          branchId: data.branchId,
          deletedAt: null,
        },
      });

      if (existing) {
        throw new BadRequestException('Product with this barcode already exists');
      }
    }

    return this.prisma.product.create({
      data: {
        ...data,
        status: ProductStatus.ACTIVE,
      },
      include: {
        category: true,
      },
    });
  }

  async update(id: string, data: Partial<IProductCreate>) {
    const product = await this.findOne(id);

    return this.prisma.product.update({
      where: { id: product.id },
      data,
      include: {
        category: true,
      },
    });
  }

  async updateStock(
    productId: string,
    quantity: number,
    userId: string,
    inputMethod: InputMethod = InputMethod.MANUAL
  ) {
    const product = await this.findOne(productId);

    const newStock = Number(product.stock) + quantity;

    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    // Update product stock
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: newStock,
        status: newStock === 0 ? ProductStatus.OUT_OF_STOCK : product.status,
      },
    });

    // Create stock movement record
    await this.prisma.stockMovement.create({
      data: {
        productId,
        branchId: product.branchId,
        type: quantity > 0 ? 'PURCHASE' : 'SALE',
        quantity: Math.abs(quantity),
        previousStock: Number(product.stock),
        newStock,
        userId,
        inputMethod,
      },
    });

    return updated;
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    return this.prisma.product.update({
      where: { id: product.id },
      data: {
        deletedAt: new Date(),
        status: ProductStatus.DISCONTINUED,
      },
    });
  }

  async getLowStockProducts(branchId: string) {
    return this.prisma.product.findMany({
      where: {
        branchId,
        deletedAt: null,
        stock: {
          lte: this.prisma.product.fields.minStock,
        },
        status: ProductStatus.ACTIVE,
      },
      include: {
        category: true,
      },
      orderBy: {
        stock: 'asc',
      },
    });
  }

  async getExpiringProducts(branchId: string, days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.product.findMany({
      where: {
        branchId,
        deletedAt: null,
        isPerishable: true,
        expirationDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });
  }
}
