import { Module } from '@nestjs/common';
import { MinimarketController } from './minimarket.controller';
import { MinimarketService } from './minimarket.service';

@Module({
  controllers: [MinimarketController],
  providers: [MinimarketService],
})
export class MinimarketModule {}
