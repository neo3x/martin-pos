import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TransbankService } from './transbank.service';

@Controller('transbank')
export class TransbankController {
  constructor(private transbankService: TransbankService) {}

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
}
