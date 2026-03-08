import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurant')
@UseGuards(JwtAuthGuard)
export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  @Get('tables')
  getTables(@Request() req) {
    return this.restaurantService.getTables(req.user.branchId);
  }

  @Get('orders')
  getOrders(@Request() req, @Query('status') status?: string) {
    return this.restaurantService.getOrders(req.user.branchId, status);
  }

  @Put('tables/:id/status')
  updateTableStatus(@Param('id') id: string, @Body() data: { status: string }, @Request() req) {
    return this.restaurantService.updateTableStatus(id, req.user.branchId, data.status);
  }

  @Post('orders')
  createOrder(@Body() data: any, @Request() req) {
    return this.restaurantService.createOrder(data, req.user.branchId, req.user.id);
  }

  @Put('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.restaurantService.updateOrderStatus(id, data.status);
  }
}
