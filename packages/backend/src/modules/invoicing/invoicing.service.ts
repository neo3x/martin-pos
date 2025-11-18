import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InvoicingService {
  constructor(private prisma: PrismaService) {}

  async createInvoiceFromSale(saleId: string, branchId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: { include: { product: true } }, customer: true },
    });

    const invoiceNumber = await this.generateInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        type: 'INVOICE',
        status: 'DRAFT',
        subtotal: sale.subtotal,
        tax: sale.tax,
        total: sale.total,
        customerName: sale.customer?.name || 'Cliente Genérico',
        customerTaxId: sale.customer?.taxId,
        customerAddress: sale.customer?.address,
        branchId,
        saleId,
        items: {
          create: sale.items.map((item) => ({
            description: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            tax: item.tax,
            total: item.total,
            productId: item.productId,
          })),
        },
      },
      include: { items: true },
    });
  }

  async issueInvoice(invoiceId: string) {
    // TODO: Generate XML/PDF for electronic invoicing
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'ISSUED', issuedAt: new Date() },
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const last = await this.prisma.invoice.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!last) return `INV-${new Date().getFullYear()}-00001`;
    const parts = last.invoiceNumber.split('-');
    const seq = parseInt(parts[2]) + 1;
    return `INV-${new Date().getFullYear()}-${seq.toString().padStart(5, '0')}`;
  }
}
