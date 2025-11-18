import { Injectable } from '@nestjs/common';
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
}
