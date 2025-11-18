import { Controller, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Post()
  create(@Body() data: any, @Request() req) {
    return this.deliveryService.createDeliveryOrder(data, req.user.branchId);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.deliveryService.updateStatus(id, data.status);
  }
}
