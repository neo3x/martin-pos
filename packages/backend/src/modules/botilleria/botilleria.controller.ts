import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BotilleriaService } from './botilleria.service';

@Controller('botilleria')
@UseGuards(JwtAuthGuard)
export class BotilleriaController {
  constructor(private botilleriaService: BotilleriaService) {}

  // ============================================
  // ALCOHOLIC PRODUCTS
  // ============================================

  @Post('products')
  createAlcoholicProduct(@Body() data: any) {
    return this.botilleriaService.createAlcoholicProduct(data);
  }

  @Get('products')
  getAlcoholicProducts(@Query() filters: any) {
    return this.botilleriaService.getAlcoholicProducts(filters);
  }

  @Get('products/wines')
  getWines(@Query('branchId') branchId: string) {
    return this.botilleriaService.getWines(branchId);
  }

  @Get('products/beers')
  getBeers(@Query('branchId') branchId: string) {
    return this.botilleriaService.getBeers(branchId);
  }

  @Get('products/spirits')
  getSpirits(@Query('branchId') branchId: string) {
    return this.botilleriaService.getSpirits(branchId);
  }

  // ============================================
  // AGE VERIFICATION
  // ============================================

  @Post('age-verification')
  verifyAge(@Body() data: any, @Request() req: any) {
    return this.botilleriaService.verifyAge({
      ...data,
      verifiedBy: req.user.id,
    });
  }

  @Get('sale-hours/:branchId')
  checkSaleHours(@Param('branchId') branchId: string) {
    return this.botilleriaService.checkSaleHoursRestriction(branchId);
  }

  // ============================================
  // TAX CALCULATION
  // ============================================

  @Post('calculate-ila')
  calculateILA(@Body() data: { baseAmount: number; taxCategory: string }) {
    return this.botilleriaService.calculateILA(data.baseAmount, data.taxCategory);
  }

  // ============================================
  // RETURNABLE CONTAINERS
  // ============================================

  @Post('containers')
  createContainer(@Body() data: any) {
    return this.botilleriaService.createReturnableContainer(data);
  }

  @Post('containers/return')
  processReturn(@Body() data: any, @Request() req: any) {
    return this.botilleriaService.processContainerReturn({
      ...data,
      processedBy: req.user.id,
    });
  }

  @Get('containers/pending/:branchId')
  getPendingContainers(@Param('branchId') branchId: string) {
    return this.botilleriaService.getPendingContainers(branchId);
  }

  // ============================================
  // TASTING EVENTS
  // ============================================

  @Post('events')
  createEvent(@Body() data: any) {
    return this.botilleriaService.createTastingEvent(data);
  }

  @Post('events/:eventId/register')
  registerAttendee(@Param('eventId') eventId: string, @Body() data: any) {
    return this.botilleriaService.registerAttendee({
      ...data,
      eventId,
    });
  }

  @Get('events/upcoming/:branchId')
  getUpcomingEvents(@Param('branchId') branchId: string) {
    return this.botilleriaService.getUpcomingEvents(branchId);
  }

  // ============================================
  // WINE CLUB
  // ============================================

  @Post('wine-club/subscribe')
  createSubscription(@Body() data: any) {
    return this.botilleriaService.createSubscription(data);
  }

  @Get('wine-club/subscriptions/:branchId')
  getSubscriptions(@Param('branchId') branchId: string) {
    return this.botilleriaService.getActiveSubscriptions(branchId);
  }

  @Put('wine-club/cancel/:subscriptionId')
  cancelSubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.botilleriaService.cancelSubscription(subscriptionId);
  }

  // ============================================
  // RECOMMENDATIONS
  // ============================================

  @Get('recommendations/:customerId')
  getRecommendations(
    @Param('customerId') customerId: string,
    @Query('limit') limit?: number,
  ) {
    return this.botilleriaService.getProductRecommendations(
      customerId,
      limit || 5,
    );
  }

  @Get('pairings')
  getPairings(@Query('food') food: string) {
    return this.botilleriaService.getPairingRecommendation(food);
  }
}
