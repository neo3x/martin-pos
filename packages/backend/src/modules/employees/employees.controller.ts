import { Controller, Get, Post, Put, Delete, Query, UseGuards, Request, Param, Body } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get('roles')
  getRoles() {
    return [
      'ADMIN',
      'MANAGER',
      'CASHIER',
      'SELLER',
      'STOCKER',
      'WAITER',
      'KITCHEN',
      'VIEWER',
    ];
  }

  @Get('workers')
  getWorkers(@Request() req, @Query('includeInactive') includeInactive?: string) {
    return this.employeesService.getWorkers(req.user.branchId, includeInactive === 'true');
  }

  @Post('workers')
  createWorker(
    @Request() req,
    @Body() data: {
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      phoneNumber?: string;
      password?: string;
    }
  ) {
    return this.employeesService.createWorker(req.user.branchId, req.user.role, data);
  }

  @Put('workers/:id')
  updateWorker(
    @Param('id') workerId: string,
    @Request() req,
    @Body() data: {
      firstName?: string;
      lastName?: string;
      role?: string;
      phoneNumber?: string;
      isActive?: boolean;
      password?: string;
    }
  ) {
    return this.employeesService.updateWorker(workerId, req.user.branchId, req.user.role, data);
  }

  @Delete('workers/:id')
  removeWorker(@Param('id') workerId: string, @Request() req) {
    return this.employeesService.removeWorker(workerId, req.user.branchId, req.user.role);
  }

  @Post('clock-in')
  clockIn(@Request() req, @Body() body?: { userId?: string }) {
    return this.employeesService.clockIn(req.user.id, req.user.branchId, req.user.role, body?.userId);
  }

  @Post('clock-out')
  clockOut(@Request() req, @Body() body?: { userId?: string }) {
    return this.employeesService.clockOut(req.user.id, req.user.branchId, req.user.role, body?.userId);
  }

  @Get('shifts')
  getShifts(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
  ) {
    return this.employeesService.getShifts(req.user.branchId, {
      userId,
      dateFrom: from ? new Date(from) : undefined,
      dateTo: to ? new Date(to) : undefined,
    });
  }

  @Get('commissions')
  getCommissions(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
  ) {
    return this.employeesService.getCommissions(req.user.branchId, {
      userId,
      dateFrom: from ? new Date(from) : undefined,
      dateTo: to ? new Date(to) : undefined,
    });
  }

  @Get(':id/performance')
  getPerformance(
    @Request() req,
    @Param('id') userId: string,
    @Query('from') from: string,
    @Query('to') to: string
  ) {
    return this.employeesService.getPerformanceMetrics(
      userId,
      req.user.branchId,
      new Date(from),
      new Date(to)
    );
  }
}


