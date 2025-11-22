import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';

// Transbank SDK types (would be imported from transbank-sdk in production)
interface WebpayPlusCreateResponse {
  token: string;
  url: string;
}

interface WebpayPlusCommitResponse {
  vci: string;
  amount: number;
  status: string;
  buy_order: string;
  session_id: string;
  card_detail: { card_number: string };
  accounting_date: string;
  transaction_date: string;
  authorization_code: string;
  payment_type_code: string;
  response_code: number;
  installments_number: number;
  installments_amount?: number;
}

@Injectable()
export class TransbankService {
  // Integration credentials (for testing)
  private readonly INTEGRATION_COMMERCE_CODE = '597055555532';
  private readonly INTEGRATION_API_KEY = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // ============================================
  // CONFIGURATION
  // ============================================

  async getConfig(branchId: string) {
    return this.prisma.transbankConfig.findUnique({
      where: { branchId },
    });
  }

  async saveConfig(data: {
    branchId: string;
    commerceCode: string;
    apiKey: string;
    environment?: string;
    isWebpayEnabled?: boolean;
    isOneclickEnabled?: boolean;
  }) {
    return this.prisma.transbankConfig.upsert({
      where: { branchId: data.branchId },
      update: {
        commerceCode: data.commerceCode,
        apiKey: data.apiKey,
        environment: data.environment || 'integration',
        isWebpayEnabled: data.isWebpayEnabled ?? true,
        isOneclickEnabled: data.isOneclickEnabled ?? false,
      },
      create: {
        branchId: data.branchId,
        commerceCode: data.commerceCode,
        apiKey: data.apiKey,
        environment: data.environment || 'integration',
        isWebpayEnabled: data.isWebpayEnabled ?? true,
        isOneclickEnabled: data.isOneclickEnabled ?? false,
      },
    });
  }

  // ============================================
  // WEBPAY PLUS
  // ============================================

  async initTransaction(data: {
    saleId: string;
    amount: number;
    branchId: string;
    returnUrl: string;
    finalUrl?: string;
  }): Promise<{ token: string; url: string; transactionId: string }> {
    const config = await this.getConfig(data.branchId);
    const environment = config?.environment || 'integration';

    // Generate unique order ID
    const buyOrder = `MPOS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = `SES-${data.saleId}`;

    // In production, use actual Transbank SDK:
    // const WebpayPlus = require('transbank-sdk').WebpayPlus;
    // const response = await (new WebpayPlus.Transaction()).create(buyOrder, sessionId, amount, returnUrl);

    // Simulated response for integration environment
    const mockToken = `TBK-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
    const mockUrl = environment === 'integration'
      ? `https://webpay3gint.transbank.cl/webpayserver/initTransaction?token=${mockToken}`
      : `https://webpay3g.transbank.cl/webpayserver/initTransaction?token=${mockToken}`;

    // Save transaction
    const transaction = await this.prisma.transbankTransaction.create({
      data: {
        saleId: data.saleId,
        buyOrder,
        sessionId,
        amount: Math.round(data.amount), // Transbank requires integers
        status: 'INITIALIZED',
        token: mockToken,
        returnUrl: data.returnUrl,
        finalUrl: data.finalUrl,
        environment,
      },
    });

    return {
      token: mockToken,
      url: mockUrl,
      transactionId: transaction.id,
    };
  }

  async commitTransaction(token: string): Promise<{
    success: boolean;
    transaction: any;
    details?: WebpayPlusCommitResponse;
  }> {
    const transaction = await this.prisma.transbankTransaction.findUnique({
      where: { token },
    });

    if (!transaction) {
      throw new BadRequestException('Transacción no encontrada');
    }

    if (transaction.status !== 'INITIALIZED') {
      throw new BadRequestException('Transacción ya procesada');
    }

    // In production, use actual Transbank SDK:
    // const WebpayPlus = require('transbank-sdk').WebpayPlus;
    // const response = await (new WebpayPlus.Transaction()).commit(token);

    // Simulated successful response for demo
    const mockResponse: WebpayPlusCommitResponse = {
      vci: 'TSY',
      amount: transaction.amount,
      status: 'AUTHORIZED',
      buy_order: transaction.buyOrder,
      session_id: transaction.sessionId,
      card_detail: { card_number: '6623' },
      accounting_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      transaction_date: new Date().toISOString(),
      authorization_code: Math.random().toString().substr(2, 6),
      payment_type_code: 'VN', // Venta normal
      response_code: 0, // 0 = Aprobada
      installments_number: 0,
    };

    const isApproved = mockResponse.response_code === 0;

    // Update transaction
    const updatedTransaction = await this.prisma.transbankTransaction.update({
      where: { id: transaction.id },
      data: {
        status: isApproved ? 'AUTHORIZED' : 'FAILED',
        responseCode: mockResponse.response_code,
        authorizationCode: mockResponse.authorization_code,
        cardNumber: mockResponse.card_detail.card_number,
        cardType: this.getCardType(mockResponse.payment_type_code),
        installmentsNumber: mockResponse.installments_number,
        installmentsAmount: mockResponse.installments_amount,
        rawResponse: mockResponse as any,
        completedAt: new Date(),
      },
    });

    return {
      success: isApproved,
      transaction: updatedTransaction,
      details: mockResponse,
    };
  }

  async getTransactionStatus(buyOrder: string) {
    const transaction = await this.prisma.transbankTransaction.findUnique({
      where: { buyOrder },
    });

    if (!transaction) {
      throw new BadRequestException('Transacción no encontrada');
    }

    return transaction;
  }

  async refundTransaction(transactionId: string, amount?: number) {
    const transaction = await this.prisma.transbankTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new BadRequestException('Transacción no encontrada');
    }

    if (transaction.status !== 'AUTHORIZED') {
      throw new BadRequestException('Solo se pueden reversar transacciones autorizadas');
    }

    const refundAmount = amount || transaction.amount;

    // In production, use actual Transbank SDK for refund
    // const response = await (new WebpayPlus.Transaction()).refund(token, refundAmount);

    const updatedTransaction = await this.prisma.transbankTransaction.update({
      where: { id: transactionId },
      data: {
        status: refundAmount === transaction.amount ? 'REVERSED' : 'AUTHORIZED',
        rawResponse: {
          ...(transaction.rawResponse as any),
          refund: {
            type: refundAmount === transaction.amount ? 'FULL' : 'PARTIAL',
            amount: refundAmount,
            date: new Date().toISOString(),
          },
        },
      },
    });

    return {
      success: true,
      transaction: updatedTransaction,
      refundedAmount: refundAmount,
    };
  }

  // ============================================
  // REPORTS
  // ============================================

  async getTransactionsByDate(branchId: string, startDate: Date, endDate: Date) {
    // Get sales for branch first, then filter transactions
    const sales = await this.prisma.sale.findMany({
      where: {
        branchId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { id: true },
    });

    const saleIds = sales.map((s) => s.id);

    return this.prisma.transbankTransaction.findMany({
      where: {
        saleId: { in: saleIds },
        status: 'AUTHORIZED',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDailySummary(branchId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.getTransactionsByDate(branchId, startOfDay, endOfDay);

    const summary = {
      date: date.toISOString().slice(0, 10),
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      byCardType: {} as Record<string, { count: number; amount: number }>,
      byStatus: {} as Record<string, number>,
    };

    transactions.forEach((t) => {
      // By card type
      const cardType = t.cardType || 'UNKNOWN';
      if (!summary.byCardType[cardType]) {
        summary.byCardType[cardType] = { count: 0, amount: 0 };
      }
      summary.byCardType[cardType].count++;
      summary.byCardType[cardType].amount += t.amount;

      // By status
      summary.byStatus[t.status] = (summary.byStatus[t.status] || 0) + 1;
    });

    return summary;
  }

  // ============================================
  // HELPERS
  // ============================================

  private getCardType(paymentTypeCode: string): string {
    const types: Record<string, string> = {
      'VD': 'DEBIT',
      'VN': 'CREDIT',
      'VC': 'CREDIT',
      'SI': 'CREDIT_INSTALLMENTS',
      'S2': 'CREDIT_2_INSTALLMENTS',
      'NC': 'CREDIT_N_INSTALLMENTS',
    };
    return types[paymentTypeCode] || 'UNKNOWN';
  }

  getResponseCodeMessage(code: number): string {
    const messages: Record<number, string> = {
      0: 'Transacción aprobada',
      [-1]: 'Rechazo de transacción',
      [-2]: 'Transacción debe reintentarse',
      [-3]: 'Error en transacción',
      [-4]: 'Rechazo de transacción',
      [-5]: 'Rechazo por error de tasa',
      [-6]: 'Excede cupo máximo mensual',
      [-7]: 'Excede límite diario por transacción',
      [-8]: 'Rubro no autorizado',
    };
    return messages[code] || 'Error desconocido';
  }
}
