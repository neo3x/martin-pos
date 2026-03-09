import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

@Controller('restaurant/public')
export class RestaurantPublicController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get('table/:token/menu')
  getPublicTableMenu(@Param('token') token: string) {
    return this.restaurantService.getPublicTableMenu(token);
  }

  @Get('table/:token/order-status')
  getPublicOrderStatus(@Param('token') token: string) {
    return this.restaurantService.getPublicOrderStatus(token);
  }

  @Post('table/:token/request')
  createServiceRequest(
    @Param('token') token: string,
    @Body() data: { type: 'CONSULTATION' | 'BILL'; message?: string },
  ) {
    return this.restaurantService.createServiceRequestFromTable(token, data);
  }
}
