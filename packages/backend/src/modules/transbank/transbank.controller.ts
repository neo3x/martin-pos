import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransbankService } from './transbank.service';
import { TransbankPOSService } from './transbank-pos.service';

@Controller('transbank')
export class TransbankController {
  constructor(
    private transbankService: TransbankService,
    private transbankPOSService: TransbankPOSService,
  ) {}

  // ============================================
  // CONFIGURATION
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Get('config/:branchId')
  getConfig(@Param('branchId') branchId: string) {
    return this.transbankService.getConfig(branchId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('config')
  saveConfig(@Body() data: any) {
    return this.transbankService.saveConfig(data);
  }

  // ============================================
  // WEBPAY PLUS TRANSACTIONS
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Post('webpay/init')
  initTransaction(@Body() data: {
    saleId: string;
    amount: number;
    branchId: string;
    returnUrl: string;
    finalUrl?: string;
  }) {
    return this.transbankService.initTransaction(data);
  }

  // This endpoint should NOT require JWT as it's called by Transbank redirect
  @Post('webpay/commit')
  async commitTransaction(@Body() body: { token_ws?: string }, @Query('token_ws') queryToken?: string) {
    const token = body.token_ws || queryToken;
    if (!token) {
      return { success: false, error: 'Token no proporcionado' };
    }
    return this.transbankService.commitTransaction(token);
  }

  // Return URL callback from Transbank
  @Get('webpay/return')
  async returnFromWebpay(@Query('token_ws') token: string) {
    if (!token) {
      return { success: false, error: 'Token no proporcionado' };
    }
    return this.transbankService.commitTransaction(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('webpay/status/:buyOrder')
  getTransactionStatus(@Param('buyOrder') buyOrder: string) {
    return this.transbankService.getTransactionStatus(buyOrder);
  }

  @UseGuards(JwtAuthGuard)
  @Post('webpay/refund/:transactionId')
  refundTransaction(
    @Param('transactionId') transactionId: string,
    @Body() body: { amount?: number },
  ) {
    return this.transbankService.refundTransaction(transactionId, body.amount);
  }

  // ============================================
  // REPORTS
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Get('reports/daily/:branchId')
  getDailySummary(
    @Param('branchId') branchId: string,
    @Query('date') dateStr?: string,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.transbankService.getDailySummary(branchId, date);
  }

  @UseGuards(JwtAuthGuard)
  @Get('reports/transactions/:branchId')
  getTransactions(
    @Param('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.transbankService.getTransactionsByDate(
      branchId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  // ============================================
  // UTILITY
  // ============================================

  @Get('response-code/:code')
  getResponseCodeMessage(@Param('code') code: string) {
    return {
      code: parseInt(code),
      message: this.transbankService.getResponseCodeMessage(parseInt(code)),
    };
  }

  // ============================================
  // PHYSICAL POS TERMINAL - MANAGEMENT
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Post('pos/terminal')
  registerPOSTerminal(@Body() data: {
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
    return this.transbankPOSService.registerTerminal(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pos/terminals/:branchId')
  getPOSTerminals(@Param('branchId') branchId: string) {
    return this.transbankPOSService.getTerminals(branchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pos/terminal/:terminalId')
  getPOSTerminalById(@Param('terminalId') terminalId: string) {
    return this.transbankPOSService.getTerminalById(terminalId);
  }

  // ============================================
  // PHYSICAL POS TERMINAL - CONNECTION
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Post('pos/terminal/:terminalId/connect')
  connectPOSTerminal(@Param('terminalId') terminalId: string) {
    return this.transbankPOSService.connectTerminal(terminalId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('pos/terminal/:terminalId/disconnect')
  disconnectPOSTerminal(@Param('terminalId') terminalId: string) {
    return this.transbankPOSService.disconnectTerminal(terminalId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pos/terminal/:terminalId/poll')
  pollPOSTerminal(@Param('terminalId') terminalId: string) {
    return this.transbankPOSService.pollTerminal(terminalId);
  }

  // ============================================
  // PHYSICAL POS TERMINAL - TRANSACTIONS
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Post('pos/sale')
  initiatePOSSale(@Body() data: {
    terminalId: string;
    amount: number;
    tip?: number;
    installments?: number;
    saleId?: string;
  }) {
    return this.transbankPOSService.initiateSale(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('pos/void')
  voidPOSTransaction(@Body() data: {
    terminalId: string;
    operationId?: string;
  }) {
    return this.transbankPOSService.voidTransaction(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pos/terminal/:terminalId/last-sale')
  getLastPOSSale(@Param('terminalId') terminalId: string) {
    return this.transbankPOSService.getLastSale(terminalId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pos/terminal/:terminalId/transactions')
  getPOSTransactions(
    @Param('terminalId') terminalId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transbankPOSService.getTransactions(terminalId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // ============================================
  // PHYSICAL POS TERMINAL - BATCH
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Post('pos/batch/open')
  openPOSBatch(@Body() data: { branchId: string; terminalId: string }) {
    return this.transbankPOSService.openBatch(data.branchId, data.terminalId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('pos/batch/close')
  closePOSBatch(@Body() data: { branchId: string; terminalId: string }) {
    return this.transbankPOSService.closeBatch(data.branchId, data.terminalId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pos/batch/summary/:branchId/:terminalId')
  getPOSBatchSummary(
    @Param('branchId') branchId: string,
    @Param('terminalId') terminalId: string,
  ) {
    return this.transbankPOSService.getBatchSummary(branchId, terminalId);
  }

  // ============================================
  // PHYSICAL POS TERMINAL - REPORTS
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Get('pos/reports/daily/:branchId')
  getPOSDailySummary(
    @Param('branchId') branchId: string,
    @Query('date') dateStr?: string,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.transbankPOSService.getDailySummary(branchId, date);
  }

  @Get('pos/response-code/:code')
  getPOSResponseCodeMessage(@Param('code') code: string) {
    return {
      code: parseInt(code),
      message: this.transbankPOSService.getResponseCodeMessage(parseInt(code)),
    };
  }
}
