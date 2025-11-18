import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  @Get('program')
  getProgram(@Request() req) {
    return this.loyaltyService.getProgramByBranch(req.user.branchId);
  }

  @Post('award')
  awardPoints(@Body() data: { customerId: string; saleAmount: number }, @Request() req) {
    return this.loyaltyService.awardPoints(data.customerId, data.saleAmount, req.user.branchId);
  }

  @Post('redeem')
  redeemPoints(@Body() data: { customerId: string; points: number }, @Request() req) {
    return this.loyaltyService.redeemPoints(data.customerId, data.points, req.user.branchId);
  }

  @Get('customer/:id/points')
  getCustomerPoints(@Param('id') customerId: string) {
    return this.loyaltyService.getCustomerPoints(customerId);
  }

  @Get('customer/:id/transactions')
  getCustomerTransactions(@Param('id') customerId: string) {
    return this.loyaltyService.getCustomerTransactions(customerId);
  }

  @Get('customer/:id/personalized-discounts')
  getPersonalizedDiscounts(@Param('id') customerId: string) {
    return this.loyaltyService.getPersonalizedDiscounts(customerId);
  }
}
