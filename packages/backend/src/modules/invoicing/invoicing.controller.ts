import { Controller, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicingController {
  constructor(private invoicingService: InvoicingService) {}

  @Post('from-sale')
  createFromSale(@Body() data: { saleId: string }, @Request() req) {
    return this.invoicingService.createInvoiceFromSale(data.saleId, req.user.branchId);
  }

  @Put(':id/issue')
  issue(@Param('id') id: string) {
    return this.invoicingService.issueInvoice(id);
  }
}
