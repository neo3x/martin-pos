import { Module } from '@nestjs/common';
import { SIIController } from './sii.controller';
import { SIIService } from './sii.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SIIController],
  providers: [SIIService],
  exports: [SIIService],
})
export class SIIModule {}
