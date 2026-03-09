import { Controller, Get, Query, UseGuards, Request, Post, Body } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('movements')
  getMovements(@Request() req, @Query() filters: any) {
    return this.inventoryService.getStockMovements(req.user.branchId, filters);
  }

  @Get('alerts')
  getAlerts(@Request() req) {
    return this.inventoryService.getAlerts(req.user.branchId);
  }

  @Get('critical-stock')
  getCriticalStock(@Request() req) {
    return this.inventoryService.getCriticalStock(req.user.branchId);
  }

  @Get('replenishment')
  getReplenishment(@Request() req) {
    return this.inventoryService.getReplenishmentSuggestions(req.user.branchId);
  }

  @Post('receive')
  receiveStock(
    @Request() req,
    @Body() body: { productId: string; quantity: number; unitCost?: number; reason?: string }
  ) {
    return this.inventoryService.receiveStock(req.user.branchId, req.user.id, body);
  }

  @Post('adjust')
  adjustStock(
    @Request() req,
    @Body() body: { productId: string; newStock: number; reason?: string }
  ) {
    return this.inventoryService.adjustStock(req.user.branchId, req.user.id, body);
  }
}


