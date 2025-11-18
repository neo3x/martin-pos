import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FraudDetectionService {
  constructor(private prisma: PrismaService) {}

  async analyzeSale(saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { user: true, items: true },
    });

    const alerts = [];

    // Unusual amount
    if (Number(sale.total) > 10000) {
      alerts.push(this.createAlert('UNUSUAL_AMOUNT', `Venta inusual: $${sale.total}`, saleId));
    }

    // Unusual time
    const hour = sale.createdAt.getHours();
    if (hour < 6 || hour > 22) {
      alerts.push(this.createAlert('UNUSUAL_TIME', `Venta fuera de horario: ${hour}:00`, saleId));
    }

    // Excessive discount
    if (Number(sale.discount) > Number(sale.subtotal) * 0.5) {
      alerts.push(this.createAlert('EXCESSIVE_DISCOUNTS', `Descuento excesivo: ${sale.discount}`, saleId));
    }

    if (alerts.length > 0) {
      await Promise.all(alerts);
    }

    return { suspicious: alerts.length > 0, alertsCreated: alerts.length };
  }

  private createAlert(type: string, description: string, saleId: string) {
    return this.prisma.fraudAlert.create({
      data: {
        type: type as any,
        severity: 'MEDIUM',
        description,
        saleId,
        status: 'PENDING',
      },
    });
  }
}
