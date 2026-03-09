import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicingController {
  constructor(private invoicingService: InvoicingService) {}

  @Get()
  findAll(@Request() req) {
    return this.invoicingService.findAll(req.user.branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoicingService.findOne(id, req.user.branchId);
  }

  @Post('from-sale')
  createFromSale(
    @Body() data: { saleId: string; type?: 'INVOICE' | 'RECEIPT' },
    @Request() req
  ) {
    return this.invoicingService.createInvoiceFromSale(data.saleId, req.user.branchId, data.type || 'INVOICE');
  }

  @Put(':id/issue')
  issue(@Param('id') id: string) {
    return this.invoicingService.issueInvoice(id);
  }
}
