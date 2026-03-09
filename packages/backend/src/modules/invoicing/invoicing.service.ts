import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InvoicingService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId: string) {
    return this.prisma.invoice.findMany({
      where: { branchId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async findOne(invoiceId: string, branchId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, branchId },
      include: { items: true },
    });

    if (!invoice) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    return invoice;
  }

  async createInvoiceFromSale(
    saleId: string,
    branchId: string,
    type: 'INVOICE' | 'RECEIPT' = 'INVOICE'
  ) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: { include: { product: true } }, customer: true },
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (sale.branchId !== branchId) {
      throw new BadRequestException('La venta no pertenece a esta sucursal');
    }

    const existing = await this.prisma.invoice.findFirst({
      where: {
        branchId,
        saleId,
        type,
      },
    });

    if (existing) {
      return existing;
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        type,
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
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    const xmlData = this.generateDemoXml(invoice);
    const pdfUrl = `/api/v1/invoices/${invoice.id}/pdf-demo`;

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
        xmlData,
        pdfUrl,
      },
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const last = await this.prisma.invoice.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!last) return `INV-${new Date().getFullYear()}-00001`;
    const parts = last.invoiceNumber.split('-');
    const seq = parseInt(parts[2]) + 1;
    return `INV-${new Date().getFullYear()}-${seq.toString().padStart(5, '0')}`;
  }

  private generateDemoXml(invoice: {
    invoiceNumber: string;
    type: string;
    customerName: string;
    subtotal: any;
    tax: any;
    total: any;
    items: Array<{ description: string; quantity: any; unitPrice: any; total: any }>;
  }) {
    const itemsXml = invoice.items
      .map(
        (item, idx) =>
          `<Item line=\"${idx + 1}\"><Description>${item.description}</Description><Qty>${item.quantity}</Qty><UnitPrice>${item.unitPrice}</UnitPrice><Total>${item.total}</Total></Item>`
      )
      .join('');

    return `<Document><Number>${invoice.invoiceNumber}</Number><Type>${invoice.type}</Type><Customer>${invoice.customerName}</Customer><Subtotal>${invoice.subtotal}</Subtotal><Tax>${invoice.tax}</Tax><Total>${invoice.total}</Total><Items>${itemsXml}</Items></Document>`;
  }
}
