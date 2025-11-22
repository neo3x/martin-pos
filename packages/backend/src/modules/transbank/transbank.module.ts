import { Module } from '@nestjs/common';
import { TransbankController } from './transbank.controller';
import { TransbankService } from './transbank.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TransbankController],
  providers: [TransbankService],
  exports: [TransbankService],
})
export class TransbankModule {}
