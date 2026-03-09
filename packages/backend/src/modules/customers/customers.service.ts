import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId: string) {
    return this.prisma.customer.findMany({
      where: { branchId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    if (data.email) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          branchId: data.branchId,
          email: data.email,
          deletedAt: null,
        },
      });

      if (existing) {
        throw new BadRequestException('Ya existe un cliente con ese email');
      }
    }

    return this.prisma.customer.create({
      data: {
        ...data,
        taxId: data.taxId || data.rut || null,
      },
    });
  }

  async findOne(id: string, branchId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        branchId,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return customer;
  }

  async update(id: string, branchId: string, data: any) {
    const customer = await this.findOne(id, branchId);
    return this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...data,
        ...(data.taxId !== undefined || data.rut !== undefined
          ? { taxId: data.taxId || data.rut || null }
          : {}),
      },
    });
  }

  async remove(id: string, branchId: string) {
    const customer = await this.findOne(id, branchId);
    return this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
