import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('sales')
  getSalesReport(@Request() req, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getSalesReport(
      req.user.branchId,
      new Date(from),
      new Date(to)
    );
  }
}
