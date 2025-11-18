import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionsController {
  constructor(private promotionsService: PromotionsService) {}

  @Get('active')
  getActive(@Request() req) {
    return this.promotionsService.getActivePromotions(req.user.branchId);
  }
}
