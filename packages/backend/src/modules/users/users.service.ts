import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IUserCreate } from '@martin-pos/shared';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId?: string) {
    return this.prisma.user.findMany({
      where: branchId ? { branchId, deletedAt: null } : { deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneNumber: true,
        avatar: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        branch: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async create(data: IUserCreate) {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Partial<IUserCreate>) {
    const user = await this.findOne(id);

    return this.prisma.user.update({
      where: { id: user.id },
      data,
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
