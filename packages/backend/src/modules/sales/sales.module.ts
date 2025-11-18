import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { ProductsModule } from '../products/products.module';
import { PrinterService } from './printer.service';

@Module({
  imports: [ProductsModule],
  controllers: [SalesController],
  providers: [SalesService, PrinterService],
  exports: [SalesService, PrinterService],
})
export class SalesModule {}
