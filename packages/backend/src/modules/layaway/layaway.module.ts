import { Module } from '@nestjs/common';
import { LayawayController } from './layaway.controller';
import { LayawayService } from './layaway.service';

@Module({
  controllers: [LayawayController],
  providers: [LayawayService],
})
export class LayawayModule {}
