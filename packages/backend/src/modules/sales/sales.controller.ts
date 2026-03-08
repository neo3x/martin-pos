import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { SalesService } from './sales.service';
import { PrinterService } from './printer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(
    private salesService: SalesService,
    private printerService: PrinterService
  ) {}

  @Get()
  findAll(@Request() req, @Query() filters: any) {
    return this.salesService.findAll(req.user.branchId, filters);
  }

  @Get('daily')
  getDailySales(@Request() req, @Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    return this.salesService.getDailySales(req.user.branchId, targetDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  async create(@Body() createData: CreateSaleDto, @Request() req) {
    return this.salesService.create(createData, req.user.id, req.user.branchId);
  }

  @Put(':id/cancel')
  cancel(@Param('id') id: string, @Request() req) {
    return this.salesService.cancelSale(id, req.user.id);
  }

  @Get(':id/print')
  async printReceipt(@Param('id') id: string, @Res() res: Response) {
    const sale = await this.salesService.findOne(id);

    try {
      await this.printerService.printSaleReceipt(sale);
      res.json({ success: true, message: 'Receipt printed successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  @Get(':id/receipt')
  async getReceiptData(@Param('id') id: string) {
    const sale = await this.salesService.findOne(id);
    return this.printerService.generateReceiptData(sale);
  }
}
