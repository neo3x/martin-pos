import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ProductStatus, InputMethod } from '@martin-pos/shared';
import { Prisma } from '@martin-pos/database';
import { CreateProductDto, UpdateProductDto, UpdateStockDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(branchId: string, filters?: any) {
    const where: Prisma.ProductWhereInput = {
      branchId,
      deletedAt: null,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { sku: { contains: filters.search, mode: 'insensitive' as const } },
          { barcode: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ? parseInt(filters.limit) : 100,
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
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
      throw new NotFoundException('Producto no encontrado');
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
      throw new NotFoundException('Producto no encontrado');
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
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async create(data: CreateProductDto & { branchId: string }) {
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
        throw new BadRequestException('Ya existe un producto con este código de barras');
      }
    }

    if (data.sku) {
      const existing = await this.prisma.product.findFirst({
        where: {
          sku: data.sku,
          branchId: data.branchId,
          deletedAt: null,
        },
      });

      if (existing) {
        throw new BadRequestException('Ya existe un producto con este SKU');
      }
    }

    const normalizedData: any = {
      ...data,
      costPrice: data.cost ?? data.price ?? 0,
      stock: data.stock ?? 0,
      minStock: data.minStock ?? 0,
      unit: data.unit || 'UN',
      status: ProductStatus.ACTIVE,
    };
    delete normalizedData.cost;

    const product = await this.prisma.product.create({
      data: {
        ...normalizedData,
      } as any,
      include: {
        category: true,
      },
    });

    this.logger.log(`Product created: ${product.name} (${product.id})`);
    return product;
  }

  async update(id: string, data: UpdateProductDto) {
    const product = await this.findOne(id);
    const normalizedData: any = {
      ...data,
      ...(data.cost !== undefined ? { costPrice: data.cost } : {}),
    };
    delete normalizedData.cost;

    return this.prisma.product.update({
      where: { id: product.id },
      data: normalizedData,
      include: {
        category: true,
      },
    });
  }

  async updateStock(
    productId: string,
    quantity: number,
    userId: string,
    inputMethod: InputMethod = InputMethod.MANUAL,
    reason?: string
  ) {
    // Use transaction to prevent race conditions
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.deletedAt) {
        throw new NotFoundException('Producto no encontrado');
      }

      const previousStock = Number(product.stock);
      const newStock = previousStock + quantity;

      if (newStock < 0) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}. Stock actual: ${previousStock}, solicitado: ${Math.abs(quantity)}`
        );
      }

      // Update product stock
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          stock: newStock,
          status: newStock === 0 ? ProductStatus.OUT_OF_STOCK : product.status,
        },
      });

      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          productId,
          branchId: product.branchId,
          type: quantity > 0 ? 'PURCHASE' : 'ADJUSTMENT',
          quantity: Math.abs(quantity),
          previousStock,
          newStock,
          userId,
          inputMethod,
          reason,
        },
      });

      this.logger.log(
        `Stock updated: ${product.name} ${previousStock} -> ${newStock} (${quantity > 0 ? '+' : ''}${quantity}) by user ${userId}`
      );

      return updated;
    });
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
    // Use raw query to compare stock with minStock column
    return this.prisma.product.findMany({
      where: {
        branchId,
        deletedAt: null,
        status: ProductStatus.ACTIVE,
        AND: [
          { minStock: { gt: 0 } },
        ],
      },
      include: {
        category: true,
      },
      orderBy: {
        stock: 'asc',
      },
    }).then(products =>
      // Filter in memory since Prisma doesn't support column-to-column comparison
      products.filter(p => Number(p.stock) <= Number(p.minStock))
    );
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
