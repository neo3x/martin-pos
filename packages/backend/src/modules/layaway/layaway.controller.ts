import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LayawayService } from './layaway.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('layaway')
@UseGuards(JwtAuthGuard)
export class LayawayController {
  constructor(private layawayService: LayawayService) {}

  @Post()
  create(@Body() data: any) {
    return this.layawayService.createLayaway(data);
  }

  @Post(':id/payment')
  addPayment(@Param('id') id: string, @Body() data: { amount: number; paymentMethod: string }) {
    return this.layawayService.addPayment(id, data.amount, data.paymentMethod);
  }
}
