import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';

const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  private canManageWorkers(role: string) {
    return MANAGER_ROLES.includes(role);
  }

  private async ensureWorker(workerId: string, branchId: string) {
    const worker = await this.prisma.user.findFirst({
      where: {
        id: workerId,
        branchId,
        deletedAt: null,
      },
    });

    if (!worker) {
      throw new NotFoundException('Trabajador no encontrado');
    }

    return worker;
  }

  async getWorkers(branchId: string, includeInactive = false) {
    return this.prisma.user.findMany({
      where: {
        branchId,
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneNumber: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  async createWorker(branchId: string, requesterRole: string, data: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phoneNumber?: string;
    password?: string;
  }) {
    if (!this.canManageWorkers(requesterRole)) {
      throw new ForbiddenException('No tiene permisos para crear trabajadores');
    }

    const exists = await this.prisma.user.findFirst({
      where: {
        email: data.email,
        deletedAt: null,
      },
    });

    if (exists) {
      throw new BadRequestException('Ya existe un usuario con este email');
    }

    const password = await bcrypt.hash(data.password || 'martin123', 10);

    const worker = await this.prisma.user.create({
      data: {
        email: data.email,
        password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any,
        phoneNumber: data.phoneNumber,
        branchId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    return {
      ...worker,
      defaultPassword: data.password ? undefined : 'martin123',
    };
  }

  async updateWorker(
    workerId: string,
    branchId: string,
    requesterRole: string,
    data: {
      firstName?: string;
      lastName?: string;
      role?: string;
      phoneNumber?: string;
      isActive?: boolean;
      password?: string;
    }
  ) {
    if (!this.canManageWorkers(requesterRole)) {
      throw new ForbiddenException('No tiene permisos para actualizar trabajadores');
    }

    const worker = await this.ensureWorker(workerId, branchId);

    if (worker.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('No se puede modificar un SUPER_ADMIN desde este módulo');
    }

    const updateData: any = {
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.role !== undefined ? { role: data.role as any } : {}),
      ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id: worker.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneNumber: true,
        createdAt: true,
      },
    });
  }

  async removeWorker(workerId: string, branchId: string, requesterRole: string) {
    if (!this.canManageWorkers(requesterRole)) {
      throw new ForbiddenException('No tiene permisos para desactivar trabajadores');
    }

    const worker = await this.ensureWorker(workerId, branchId);

    if (worker.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('No se puede desactivar un SUPER_ADMIN desde este módulo');
    }

    return this.prisma.user.update({
      where: { id: worker.id },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  async clockIn(
    requesterId: string,
    branchId: string,
    requesterRole: string,
    targetUserId?: string,
  ) {
    const userId = targetUserId || requesterId;

    if (targetUserId && targetUserId !== requesterId && !this.canManageWorkers(requesterRole)) {
      throw new ForbiddenException('No tiene permisos para marcar turnos de otro trabajador');
    }

    await this.ensureWorker(userId, branchId);

    const activeShift = await this.prisma.employeeShift.findFirst({
      where: { userId, endTime: null },
    });

    if (activeShift) {
      throw new BadRequestException('Ya hay un turno activo para este trabajador');
    }

    return this.prisma.employeeShift.create({
      data: {
        userId,
        startTime: new Date(),
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
  }

  async clockOut(
    requesterId: string,
    branchId: string,
    requesterRole: string,
    targetUserId?: string,
  ) {
    const userId = targetUserId || requesterId;

    if (targetUserId && targetUserId !== requesterId && !this.canManageWorkers(requesterRole)) {
      throw new ForbiddenException('No tiene permisos para marcar turnos de otro trabajador');
    }

    await this.ensureWorker(userId, branchId);

    const activeShift = await this.prisma.employeeShift.findFirst({
      where: { userId, endTime: null },
      orderBy: { startTime: 'desc' },
    });

    if (!activeShift) {
      throw new BadRequestException('No hay turno activo para este trabajador');
    }

    const endTime = new Date();
    const totalHours = (endTime.getTime() - activeShift.startTime.getTime()) / (1000 * 60 * 60);

    return this.prisma.employeeShift.update({
      where: { id: activeShift.id },
      data: {
        endTime,
        totalHours,
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
  }

  async getShifts(branchId: string, filters?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    return this.prisma.employeeShift.findMany({
      where: {
        user: {
          branchId,
        },
        ...(filters?.userId ? { userId: filters.userId } : {}),
        ...(filters?.dateFrom && filters?.dateTo
          ? {
              startTime: {
                gte: filters.dateFrom,
                lte: filters.dateTo,
              },
            }
          : {}),
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
      orderBy: { startTime: 'desc' },
      take: 300,
    });
  }

  async calculateCommission(userId: string, saleId: string, saleAmount: number) {
    const percentage = 3;
    const amount = (saleAmount * percentage) / 100;

    return this.prisma.commission.create({
      data: {
        userId,
        saleId,
        amount,
        percentage,
        baseSaleAmount: saleAmount,
      },
    });
  }

  async getCommissions(branchId: string, filters?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    return this.prisma.commission.findMany({
      where: {
        user: {
          branchId,
        },
        ...(filters?.userId ? { userId: filters.userId } : {}),
        ...(filters?.dateFrom && filters?.dateTo
          ? {
              createdAt: {
                gte: filters.dateFrom,
                lte: filters.dateTo,
              },
            }
          : {}),
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPerformanceMetrics(userId: string, branchId: string, dateFrom: Date, dateTo: Date) {
    await this.ensureWorker(userId, branchId);

    const sales = await this.prisma.sale.findMany({
      where: {
        userId,
        branchId,
        status: 'COMPLETED',
        createdAt: { gte: dateFrom, lte: dateTo },
      },
    });

    const shifts = await this.getShifts(branchId, { userId, dateFrom, dateTo });
    const commissions = await this.getCommissions(branchId, { userId, dateFrom, dateTo });

    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalHours = shifts.reduce((sum, shift) => sum + Number(shift.totalHours || 0), 0);
    const totalCommissions = commissions.reduce((sum, comm) => sum + Number(comm.amount), 0);

    return {
      totalSales,
      salesCount: sales.length,
      averageSale: sales.length > 0 ? totalSales / sales.length : 0,
      totalHours,
      totalCommissions,
      salesPerHour: totalHours > 0 ? totalSales / totalHours : 0,
    };
  }
}
