import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IAIQuery } from '@martin-pos/shared';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('query')
  async query(@Body() data: { query: string; context?: any }, @Request() req) {
    const queryData: IAIQuery = {
      query: data.query,
      context: data.context,
      userId: req.user.id,
      branchId: req.user.branchId,
    };

    return this.aiService.query(queryData);
  }

  @Get('inventory/analyze')
  async analyzeInventory(@Request() req) {
    return this.aiService.analyzeInventory(req.user.branchId);
  }

  @Get('reports/daily')
  async generateDailyReport(@Request() req, @Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const report = await this.aiService.generateDailyReport(req.user.branchId, targetDate);
    return { report, date: targetDate };
  }

  @Get('pricing/:productId')
  async suggestPricing(@Param('productId') productId: string) {
    return this.aiService.suggestOptimalPricing(productId);
  }
}
