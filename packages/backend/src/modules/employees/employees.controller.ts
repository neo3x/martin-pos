import { Controller, Get, Post, Query, UseGuards, Request, Param } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Post('clock-in')
  clockIn(@Request() req) {
    return this.employeesService.clockIn(req.user.id);
  }

  @Post('clock-out')
  clockOut(@Request() req) {
    return this.employeesService.clockOut(req.user.id);
  }

  @Get('shifts')
  getShifts(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.employeesService.getShifts(
      req.user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );
  }

  @Get('commissions')
  getCommissions(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.employeesService.getCommissions(
      req.user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );
  }

  @Get(':id/performance')
  getPerformance(
    @Param('id') userId: string,
    @Query('from') from: string,
    @Query('to') to: string
  ) {
    return this.employeesService.getPerformanceMetrics(
      userId,
      new Date(from),
      new Date(to)
    );
  }
}
