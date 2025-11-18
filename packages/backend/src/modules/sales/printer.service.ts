import { Injectable } from '@nestjs/common';
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';
import { formatCurrency, formatDate } from '@martin-pos/shared';

@Injectable()
export class PrinterService {
  private printer: ThermalPrinter;

  constructor() {
    // Initialize printer (will be configured per branch)
    this.initializePrinter();
  }

  private initializePrinter() {
    this.printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: process.env.PRINTER_PORT || 'tcp://localhost:9100',
      characterSet: CharacterSet.PC437_USA,
      breakLine: BreakLine.WORD,
      options: {
        timeout: 5000,
      },
    });
  }

  async printSaleReceipt(sale: any): Promise<void> {
    try {
      this.printer.clear();

      // Header
      this.printer.alignCenter();
      this.printer.setTextSize(1, 1);
      this.printer.bold(true);
      this.printer.println(sale.branch?.name || 'Martin POS');
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.println(sale.branch?.address || '');
      this.printer.println(sale.branch?.phone || '');
      this.printer.newLine();

      // Sale info
      this.printer.alignLeft();
      this.printer.println(`Ticket: ${sale.saleNumber}`);
      this.printer.println(`Fecha: ${formatDate(sale.createdAt, 'long')}`);
      this.printer.println(`Cajero: ${sale.user.firstName} ${sale.user.lastName}`);
      if (sale.customer) {
        this.printer.println(`Cliente: ${sale.customer.name}`);
      }
      this.printer.drawLine();

      // Items
      this.printer.tableCustom([
        { text: 'Producto', align: 'LEFT', width: 0.5 },
        { text: 'Cant', align: 'CENTER', width: 0.15 },
        { text: 'P.Unit', align: 'RIGHT', width: 0.17 },
        { text: 'Total', align: 'RIGHT', width: 0.18 },
      ]);
      this.printer.drawLine();

      for (const item of sale.items) {
        this.printer.tableCustom([
          { text: item.product.name, align: 'LEFT', width: 0.5 },
          { text: item.quantity.toString(), align: 'CENTER', width: 0.15 },
          { text: formatCurrency(Number(item.unitPrice)), align: 'RIGHT', width: 0.17 },
          { text: formatCurrency(Number(item.total)), align: 'RIGHT', width: 0.18 },
        ]);
      }

      this.printer.drawLine();

      // Totals
      this.printer.alignRight();
      this.printer.println(`Subtotal: ${formatCurrency(Number(sale.subtotal))}`);
      if (Number(sale.discount) > 0) {
        this.printer.println(`Descuento: -${formatCurrency(Number(sale.discount))}`);
      }
      this.printer.println(`IVA: ${formatCurrency(Number(sale.tax))}`);
      this.printer.newLine();
      this.printer.setTextSize(1, 1);
      this.printer.bold(true);
      this.printer.println(`TOTAL: ${formatCurrency(Number(sale.total))}`);
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.newLine();

      // Payment method
      this.printer.alignLeft();
      this.printer.println(`Forma de pago: ${this.getPaymentMethodLabel(sale.paymentMethod)}`);

      // Footer
      this.printer.newLine();
      this.printer.alignCenter();
      this.printer.println('¡Gracias por su compra!');
      this.printer.newLine();
      this.printer.println('Sistema Martin POS');
      this.printer.newLine();
      this.printer.newLine();
      this.printer.newLine();

      // Cut paper
      this.printer.cut();

      // Execute print
      await this.printer.execute();
      console.log('✅ Receipt printed successfully');
    } catch (error) {
      console.error('❌ Print error:', error);
      throw error;
    }
  }

  generateReceiptData(sale: any) {
    return {
      saleNumber: sale.saleNumber,
      date: formatDate(sale.createdAt, 'long'),
      cashier: `${sale.user.firstName} ${sale.user.lastName}`,
      customer: sale.customer?.name,
      items: sale.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: formatCurrency(Number(item.unitPrice)),
        total: formatCurrency(Number(item.total)),
      })),
      subtotal: formatCurrency(Number(sale.subtotal)),
      discount: formatCurrency(Number(sale.discount)),
      tax: formatCurrency(Number(sale.tax)),
      total: formatCurrency(Number(sale.total)),
      paymentMethod: this.getPaymentMethodLabel(sale.paymentMethod),
    };
  }

  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta',
      TRANSFER: 'Transferencia',
      QR: 'Código QR',
      CREDIT: 'Crédito',
      MIXED: 'Mixto',
    };
    return labels[method] || method;
  }

  async printLabel(product: any): Promise<void> {
    try {
      this.printer.clear();

      this.printer.alignCenter();
      this.printer.setTextSize(1, 1);
      this.printer.bold(true);
      this.printer.println(product.name);
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.newLine();

      if (product.barcode) {
        // Print barcode (implementation depends on printer capabilities)
        this.printer.println(`Código: ${product.barcode}`);
      }

      this.printer.newLine();
      this.printer.setTextSize(1, 1);
      this.printer.bold(true);
      this.printer.println(formatCurrency(Number(product.price)));
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.newLine();

      this.printer.println(`SKU: ${product.sku}`);
      this.printer.newLine();
      this.printer.newLine();

      this.printer.cut();
      await this.printer.execute();

      console.log('✅ Label printed successfully');
    } catch (error) {
      console.error('❌ Print error:', error);
      throw error;
    }
  }
}
