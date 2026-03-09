import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId: string) {
    return this.prisma.category.findMany({
      where: { branchId, deletedAt: null },
      include: { children: true, parent: true },
    });
  }

  async create(data: any) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, branchId: string, data: any) {
    const category = await this.prisma.category.findFirst({
      where: { id, branchId, deletedAt: null },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.prisma.category.update({
      where: { id: category.id },
      data,
    });
  }

  async remove(id: string, branchId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, branchId, deletedAt: null },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.prisma.category.update({
      where: { id: category.id },
      data: { deletedAt: new Date() },
    });
  }
}
