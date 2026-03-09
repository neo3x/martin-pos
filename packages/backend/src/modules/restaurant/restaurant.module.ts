import { Module } from '@nestjs/common';
import { RestaurantController } from './restaurant.controller';
import { RestaurantPublicController } from './restaurant.public.controller';
import { RestaurantService } from './restaurant.service';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [SalesModule],
  controllers: [RestaurantController, RestaurantPublicController],
  providers: [RestaurantService],
})
export class RestaurantModule {}
