import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

// Códigos de operación Transbank POS Integrado
const POS_OPERATIONS = {
  SALE: '0200',           // Venta
  VOID: '0400',           // Anulación
  LAST_SALE: '0250',      // Última venta
  TOTALS: '0700',         // Totales
  CLOSE_BATCH: '0500',    // Cierre de lote
  DETAILS: '0260',        // Detalle de ventas
  KEYS: '0800',           // Carga de llaves
  POLL: '0100',           // Polling
  MULTICODE_SALE: '0270', // Venta multicódigo
  REFUND: '0280',         // Devolución
};

// Códigos de respuesta comunes
const RESPONSE_CODES: Record<number, string> = {
  0: 'Aprobado',
  1: 'Rechazado',
  2: 'Host no conectado',
  3: 'Conexión fallida',
  4: 'Transacción ya fue anulada',
  5: 'No existe transacción para anular',
  6: 'Tarjeta no soportada',
  7: 'Transacción cancelada desde POS',
  8: 'No puede anular, monto excede disponible',
  9: 'Error en lectura de tarjeta',
  10: 'Monto menor al mínimo permitido',
  11: 'No existe número de comercio',
  12: 'Problema con parámetros POS',
  13: 'Sin conexión',
  14: 'POS en modo ocupado',
};

interface POSSaleRequest {
  terminalId: string;
  amount: number;
  tip?: number;
  installments?: number;
  saleId?: string;
}

interface POSVoidRequest {
  terminalId: string;
  operationId?: string;
}

interface POSResponse {
  success: boolean;
  responseCode?: number;
  responseMessage?: string;
  authorizationCode?: string;
  transactionId?: string;
  cardNumber?: string;
  cardType?: string;
  cardBrand?: string;
  amount?: number;
  tip?: number;
  totalAmount?: number;
  voucherNumber?: string;
  printData?: string;
  rawResponse?: Record<string, any>;
}

@Injectable()
export class TransbankPOSService {
  private readonly logger = new Logger(TransbankPOSService.name);
  // Simulated terminal connections (in production, use serialport library)
  private connectedTerminals: Map<string, boolean> = new Map();

  constructor(private prisma: DatabaseService) {}

  // ============================================
  // TERMINAL MANAGEMENT
  // ============================================

  async registerTerminal(data: {
    branchId: string;
    terminalId: string;
    serialNumber?: string;
    model?: string;
    name: string;
    location?: string;
    connectionType: string;
    port?: string;
    ipAddress?: string;
  }) {
    // Get or create config for branch
    let config = await this.prisma.transbankConfig.findUnique({
      where: { branchId: data.branchId },
    });

    if (!config) {
      config = await this.prisma.transbankConfig.create({
        data: {
          branchId: data.branchId,
          commerceCode: 'DEMO-' + data.branchId,
          apiKey: 'demo-key',
          isPOSEnabled: true,
        },
      });
    }

    // Create terminal
    const terminal = await this.prisma.pOSTerminal.create({
      data: {
        terminalId: data.terminalId,
        serialNumber: data.serialNumber,
        model: data.model,
        name: data.name,
        location: data.location,
        connectionType: data.connectionType as any,
        port: data.port,
        ipAddress: data.ipAddress,
        branchId: data.branchId,
        configId: config.id,
        status: 'DISCONNECTED',
      },
    });

    return terminal;
  }

  async getTerminals(branchId: string) {
    return this.prisma.pOSTerminal.findMany({
      where: { branchId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTerminalById(terminalId: string) {
    return this.prisma.pOSTerminal.findUnique({
      where: { terminalId },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateTerminalStatus(terminalId: string, status: string) {
    return this.prisma.pOSTerminal.update({
      where: { terminalId },
      data: {
        status: status as any,
        lastPingAt: status === 'CONNECTED' ? new Date() : undefined,
      },
    });
  }

  // ============================================
  // TERMINAL CONNECTION (Simulated)
  // ============================================

  async connectTerminal(terminalId: string): Promise<{ success: boolean; message: string }> {
    const terminal = await this.prisma.pOSTerminal.findUnique({
      where: { terminalId },
    });

    if (!terminal) {
      return { success: false, message: 'Terminal no encontrado' };
    }

    // Simulate connection (in production, open serial/TCP connection)
    this.logger.log(`Connecting to terminal ${terminalId} via ${terminal.connectionType}...`);

    // Simulate polling to check terminal
    await this.simulateDelay(500);

    // Mark as connected
    this.connectedTerminals.set(terminalId, true);
    await this.updateTerminalStatus(terminalId, 'CONNECTED');

    return { success: true, message: 'Terminal conectado exitosamente' };
  }

  async disconnectTerminal(terminalId: string): Promise<{ success: boolean; message: string }> {
    this.connectedTerminals.delete(terminalId);
    await this.updateTerminalStatus(terminalId, 'DISCONNECTED');
    return { success: true, message: 'Terminal desconectado' };
  }

  async pollTerminal(terminalId: string): Promise<POSResponse> {
    if (!this.isTerminalConnected(terminalId)) {
      return { success: false, responseCode: 13, responseMessage: 'Terminal no conectado' };
    }

    // Simulate poll command
    this.logger.log(`Polling terminal ${terminalId}...`);
    await this.simulateDelay(200);

    return {
      success: true,
      responseCode: 0,
      responseMessage: 'Terminal listo',
    };
  }

  // ============================================
  // PAYMENT OPERATIONS
  // ============================================

  async initiateSale(request: POSSaleRequest): Promise<POSResponse> {
    const { terminalId, amount, tip = 0, installments = 0, saleId } = request;

    // Validate terminal connection
    if (!this.isTerminalConnected(terminalId)) {
      return { success: false, responseCode: 13, responseMessage: 'Terminal no conectado' };
    }

    // Validate minimum amount (CLP)
    if (amount < 50) {
      return { success: false, responseCode: 10, responseMessage: 'Monto menor al mínimo permitido' };
    }

    // Update terminal status
    await this.updateTerminalStatus(terminalId, 'BUSY');

    // Create transaction record
    const posTransaction = await this.prisma.pOSTransaction.create({
      data: {
        saleId,
        terminalId: (await this.prisma.pOSTerminal.findUnique({ where: { terminalId } }))!.id,
        operationCode: POS_OPERATIONS.SALE,
        amount,
        tip,
        totalAmount: amount + tip,
        installments,
        status: 'PROCESSING',
        initiatedAt: new Date(),
      },
    });

    try {
      // Simulate sending sale command to terminal
      this.logger.log(`Initiating sale on terminal ${terminalId}: $${amount} CLP`);

      // In production: send command via serial/TCP and wait for card swipe/insert
      await this.simulateDelay(2000);

      // Simulate successful response
      const mockResponse = this.generateMockSaleResponse(amount, tip);

      // Update transaction with response
      await this.prisma.pOSTransaction.update({
        where: { id: posTransaction.id },
        data: {
          status: mockResponse.success ? 'APPROVED' : 'DECLINED',
          authorizationCode: mockResponse.authorizationCode,
          responseCode: mockResponse.responseCode,
          responseMessage: mockResponse.responseMessage,
          cardNumber: mockResponse.cardNumber,
          cardType: mockResponse.cardType,
          cardBrand: mockResponse.cardBrand,
          voucherNumber: mockResponse.voucherNumber,
          printData: mockResponse.printData,
          rawResponse: mockResponse.rawResponse,
          transactionDate: new Date(),
          transactionTime: new Date().toTimeString().split(' ')[0],
          completedAt: new Date(),
        },
      });

      // Update terminal last transaction
      await this.prisma.pOSTerminal.update({
        where: { terminalId },
        data: {
          status: 'CONNECTED',
          lastTransactionAt: new Date(),
        },
      });

      return {
        ...mockResponse,
        transactionId: posTransaction.id,
      };
    } catch (error) {
      // Update transaction as error
      await this.prisma.pOSTransaction.update({
        where: { id: posTransaction.id },
        data: {
          status: 'ERROR',
          responseMessage: error instanceof Error ? error.message : 'Error desconocido',
          completedAt: new Date(),
        },
      });

      await this.updateTerminalStatus(terminalId, 'CONNECTED');

      return {
        success: false,
        responseCode: -1,
        responseMessage: 'Error en comunicación con terminal',
        transactionId: posTransaction.id,
      };
    }
  }

  async voidTransaction(request: POSVoidRequest): Promise<POSResponse> {
    const { terminalId, operationId } = request;

    if (!this.isTerminalConnected(terminalId)) {
      return { success: false, responseCode: 13, responseMessage: 'Terminal no conectado' };
    }

    // Get last transaction if no operationId provided
    let transaction: any;
    if (operationId) {
      transaction = await this.prisma.pOSTransaction.findUnique({
        where: { id: operationId },
      });
    } else {
      const terminal = await this.prisma.pOSTerminal.findUnique({ where: { terminalId } });
      transaction = await this.prisma.pOSTransaction.findFirst({
        where: {
          terminalId: terminal!.id,
          status: 'APPROVED',
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!transaction) {
      return { success: false, responseCode: 5, responseMessage: 'No existe transacción para anular' };
    }

    if (transaction.status === 'VOIDED') {
      return { success: false, responseCode: 4, responseMessage: 'Transacción ya fue anulada' };
    }

    // Update terminal status
    await this.updateTerminalStatus(terminalId, 'BUSY');

    try {
      this.logger.log(`Voiding transaction ${transaction.id} on terminal ${terminalId}`);
      await this.simulateDelay(1500);

      // Create void transaction
      const voidTx = await this.prisma.pOSTransaction.create({
        data: {
          saleId: transaction.saleId,
          terminalId: transaction.terminalId,
          operationCode: POS_OPERATIONS.VOID,
          amount: -transaction.amount,
          tip: -transaction.tip,
          totalAmount: -(transaction.totalAmount),
          status: 'APPROVED',
          authorizationCode: this.generateAuthCode(),
          responseCode: 0,
          responseMessage: 'Anulación aprobada',
          voucherNumber: 'V' + Date.now(),
          transactionDate: new Date(),
          transactionTime: new Date().toTimeString().split(' ')[0],
          completedAt: new Date(),
        },
      });

      // Update original transaction
      await this.prisma.pOSTransaction.update({
        where: { id: transaction.id },
        data: { status: 'VOIDED' },
      });

      await this.updateTerminalStatus(terminalId, 'CONNECTED');

      return {
        success: true,
        responseCode: 0,
        responseMessage: 'Anulación aprobada',
        transactionId: voidTx.id,
        authorizationCode: voidTx.authorizationCode!,
      };
    } catch (error) {
      await this.updateTerminalStatus(terminalId, 'CONNECTED');
      return { success: false, responseCode: -1, responseMessage: 'Error al anular transacción' };
    }
  }

  async getLastSale(terminalId: string): Promise<POSResponse> {
    const terminal = await this.prisma.pOSTerminal.findUnique({ where: { terminalId } });
    if (!terminal) {
      return { success: false, responseCode: -1, responseMessage: 'Terminal no encontrado' };
    }

    const lastTransaction = await this.prisma.pOSTransaction.findFirst({
      where: {
        terminalId: terminal.id,
        operationCode: POS_OPERATIONS.SALE,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastTransaction) {
      return { success: false, responseCode: 5, responseMessage: 'No hay ventas registradas' };
    }

    return {
      success: true,
      responseCode: 0,
      transactionId: lastTransaction.id,
      amount: lastTransaction.amount,
      tip: lastTransaction.tip,
      totalAmount: lastTransaction.totalAmount,
      authorizationCode: lastTransaction.authorizationCode || undefined,
      cardNumber: lastTransaction.cardNumber || undefined,
      cardType: lastTransaction.cardType || undefined,
      voucherNumber: lastTransaction.voucherNumber || undefined,
    };
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  async openBatch(branchId: string, terminalId: string) {
    // Check if there's an open batch
    const existingBatch = await this.prisma.pOSBatch.findFirst({
      where: { branchId, terminalId, status: 'OPEN' },
    });

    if (existingBatch) {
      return { success: false, message: 'Ya existe un lote abierto', batch: existingBatch };
    }

    // Get last batch number
    const lastBatch = await this.prisma.pOSBatch.findFirst({
      where: { branchId, terminalId },
      orderBy: { batchNumber: 'desc' },
    });

    const batch = await this.prisma.pOSBatch.create({
      data: {
        branchId,
        terminalId,
        batchNumber: (lastBatch?.batchNumber || 0) + 1,
        status: 'OPEN',
      },
    });

    return { success: true, message: 'Lote abierto', batch };
  }

  async closeBatch(branchId: string, terminalId: string): Promise<{
    success: boolean;
    message: string;
    summary?: any;
  }> {
    if (!this.isTerminalConnected(terminalId)) {
      return { success: false, message: 'Terminal no conectado' };
    }

    const terminal = await this.prisma.pOSTerminal.findUnique({ where: { terminalId } });
    if (!terminal) {
      return { success: false, message: 'Terminal no encontrado' };
    }

    const batch = await this.prisma.pOSBatch.findFirst({
      where: { branchId, terminalId: terminal.id, status: 'OPEN' },
    });

    if (!batch) {
      return { success: false, message: 'No hay lote abierto para cerrar' };
    }

    // Get all transactions for this batch
    const transactions = await this.prisma.pOSTransaction.findMany({
      where: {
        terminalId: terminal.id,
        status: 'APPROVED',
        createdAt: { gte: batch.openedAt },
      },
    });

    // Calculate totals
    const sales = transactions.filter((t) => t.operationCode === POS_OPERATIONS.SALE);
    const voids = transactions.filter((t) => t.operationCode === POS_OPERATIONS.VOID);

    const creditTx = sales.filter((t) => t.cardBrand === 'CREDIT');
    const debitTx = sales.filter((t) => t.cardBrand === 'DEBIT');

    const summary = {
      totalTransactions: transactions.length,
      totalSales: sales.length,
      totalVoids: voids.length,
      totalAmount: sales.reduce((sum, t) => sum + t.totalAmount, 0),
      totalTips: sales.reduce((sum, t) => sum + t.tip, 0),
      creditCount: creditTx.length,
      creditAmount: creditTx.reduce((sum, t) => sum + t.totalAmount, 0),
      debitCount: debitTx.length,
      debitAmount: debitTx.reduce((sum, t) => sum + t.totalAmount, 0),
    };

    // Simulate batch close command to terminal
    await this.updateTerminalStatus(terminalId, 'BUSY');
    this.logger.log(`Closing batch on terminal ${terminalId}...`);
    await this.simulateDelay(1500);

    // Update batch
    await this.prisma.pOSBatch.update({
      where: { id: batch.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        ...summary,
        closingData: summary,
        closingReport: this.generateClosingReport(summary),
      },
    });

    await this.updateTerminalStatus(terminalId, 'CONNECTED');

    // Open new batch automatically
    await this.openBatch(branchId, terminal.id);

    return { success: true, message: 'Lote cerrado exitosamente', summary };
  }

  async getBatchSummary(branchId: string, terminalId: string) {
    const terminal = await this.prisma.pOSTerminal.findUnique({ where: { terminalId } });
    if (!terminal) {
      return null;
    }

    const batch = await this.prisma.pOSBatch.findFirst({
      where: { branchId, terminalId: terminal.id, status: 'OPEN' },
    });

    if (!batch) {
      return null;
    }

    const transactions = await this.prisma.pOSTransaction.findMany({
      where: {
        terminalId: terminal.id,
        status: 'APPROVED',
        createdAt: { gte: batch.openedAt },
      },
    });

    const sales = transactions.filter((t) => t.operationCode === POS_OPERATIONS.SALE);

    return {
      batch,
      transactionCount: sales.length,
      totalAmount: sales.reduce((sum, t) => sum + t.totalAmount, 0),
      totalTips: sales.reduce((sum, t) => sum + t.tip, 0),
    };
  }

  // ============================================
  // TRANSACTION HISTORY
  // ============================================

  async getTransactions(terminalId: string, options: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    limit?: number;
  } = {}) {
    const terminal = await this.prisma.pOSTerminal.findUnique({ where: { terminalId } });
    if (!terminal) {
      return [];
    }

    const where: any = { terminalId: terminal.id };

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    if (options.status) {
      where.status = options.status;
    }

    return this.prisma.pOSTransaction.findMany({
      where,
      take: options.limit || 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDailySummary(branchId: string, date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const terminals = await this.prisma.pOSTerminal.findMany({
      where: { branchId },
    });

    const terminalIds = terminals.map((t) => t.id);

    const transactions = await this.prisma.pOSTransaction.findMany({
      where: {
        terminalId: { in: terminalIds },
        status: 'APPROVED',
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { terminal: true },
    });

    const sales = transactions.filter((t) => t.operationCode === POS_OPERATIONS.SALE);
    const voids = transactions.filter((t) => t.operationCode === POS_OPERATIONS.VOID);

    return {
      date: date.toISOString().split('T')[0],
      totalTransactions: sales.length,
      totalVoids: voids.length,
      totalAmount: sales.reduce((sum, t) => sum + t.totalAmount, 0),
      totalTips: sales.reduce((sum, t) => sum + t.tip, 0),
      byTerminal: terminals.map((terminal) => {
        const terminalSales = sales.filter((t) => t.terminalId === terminal.id);
        return {
          terminalId: terminal.terminalId,
          name: terminal.name,
          transactions: terminalSales.length,
          amount: terminalSales.reduce((sum, t) => sum + t.totalAmount, 0),
        };
      }),
      byCardType: {
        credit: {
          count: sales.filter((t) => t.cardBrand === 'CREDIT').length,
          amount: sales.filter((t) => t.cardBrand === 'CREDIT').reduce((sum, t) => sum + t.totalAmount, 0),
        },
        debit: {
          count: sales.filter((t) => t.cardBrand === 'DEBIT').length,
          amount: sales.filter((t) => t.cardBrand === 'DEBIT').reduce((sum, t) => sum + t.totalAmount, 0),
        },
      },
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private isTerminalConnected(terminalId: string): boolean {
    return this.connectedTerminals.get(terminalId) === true;
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateAuthCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private generateMockSaleResponse(amount: number, tip: number): POSResponse {
    const cardTypes = ['VISA', 'MASTERCARD', 'AMEX'];
    const cardBrands = ['CREDIT', 'DEBIT'];
    const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    const cardBrand = cardBrands[Math.floor(Math.random() * cardBrands.length)];
    const lastFour = Math.floor(1000 + Math.random() * 9000).toString();

    return {
      success: true,
      responseCode: 0,
      responseMessage: 'Aprobado',
      authorizationCode: this.generateAuthCode(),
      cardNumber: `****${lastFour}`,
      cardType,
      cardBrand,
      amount,
      tip,
      totalAmount: amount + tip,
      voucherNumber: 'V' + Date.now(),
      printData: this.generateVoucherData(amount, tip, cardType, lastFour),
      rawResponse: {
        function: POS_OPERATIONS.SALE,
        responseCode: 0,
        amount,
        tip,
        cardNumber: `****${lastFour}`,
        cardType,
      },
    };
  }

  private generateVoucherData(amount: number, tip: number, cardType: string, lastFour: string): string {
    const now = new Date();
    return `
═══════════════════════════════
      COMPROBANTE DE VENTA
        TRANSBANK POS
═══════════════════════════════
Fecha: ${now.toLocaleDateString('es-CL')}
Hora: ${now.toLocaleTimeString('es-CL')}

Tarjeta: ${cardType}
Número: ****${lastFour}

Monto:    $${amount.toLocaleString('es-CL')}
Propina:  $${tip.toLocaleString('es-CL')}
────────────────────────────────
TOTAL:    $${(amount + tip).toLocaleString('es-CL')}

Estado: APROBADO

═══════════════════════════════
     Gracias por su compra
═══════════════════════════════
    `.trim();
  }

  private generateClosingReport(summary: any): string {
    const now = new Date();
    return `
═══════════════════════════════════════
        CIERRE DE LOTE
        TRANSBANK POS
═══════════════════════════════════════
Fecha: ${now.toLocaleDateString('es-CL')}
Hora: ${now.toLocaleTimeString('es-CL')}

RESUMEN DE TRANSACCIONES
────────────────────────────────────────
Total Ventas:      ${summary.totalSales}
Total Anulaciones: ${summary.totalVoids}
────────────────────────────────────────

MONTOS
────────────────────────────────────────
Monto Ventas:  $${summary.totalAmount.toLocaleString('es-CL')}
Propinas:      $${summary.totalTips.toLocaleString('es-CL')}
────────────────────────────────────────

POR TIPO DE TARJETA
────────────────────────────────────────
Crédito:
  Cantidad: ${summary.creditCount}
  Monto:    $${summary.creditAmount.toLocaleString('es-CL')}

Débito:
  Cantidad: ${summary.debitCount}
  Monto:    $${summary.debitAmount.toLocaleString('es-CL')}
────────────────────────────────────────

═══════════════════════════════════════
          LOTE CERRADO
═══════════════════════════════════════
    `.trim();
  }

  getResponseCodeMessage(code: number): string {
    return RESPONSE_CODES[code] || 'Código de respuesta desconocido';
  }
}
