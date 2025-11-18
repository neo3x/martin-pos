import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
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
}
