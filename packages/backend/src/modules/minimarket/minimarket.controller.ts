import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MinimarketService } from './minimarket.service';

@Controller('minimarket')
@UseGuards(JwtAuthGuard)
export class MinimarketController {
  constructor(private minimarketService: MinimarketService) {}

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.minimarketService.getDashboard(req.user.branchId);
  }

  @Get('quick-sale-context')
  getQuickSaleContext(@Request() req: any) {
    return this.minimarketService.getQuickSaleContext(req.user.branchId);
  }
}
