import { Module } from '@nestjs/common';
import { TransbankController } from './transbank.controller';
import { TransbankService } from './transbank.service';
import { TransbankPOSService } from './transbank-pos.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TransbankController],
  providers: [TransbankService, TransbankPOSService],
  exports: [TransbankService, TransbankPOSService],
})
export class TransbankModule {}
