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
  Request,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurant')
@UseGuards(JwtAuthGuard)
export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  @Get('tables')
  getTables(@Request() req) {
    return this.restaurantService.getTables(req.user.branchId);
  }

  @Post('tables')
  createTable(
    @Request() req,
    @Body() data: { number: string; capacity: number; status?: string },
  ) {
    return this.restaurantService.createTable(req.user.branchId, data);
  }

  @Put('tables/:id')
  updateTable(
    @Request() req,
    @Param('id') tableId: string,
    @Body() data: { number?: string; capacity?: number; status?: string },
  ) {
    return this.restaurantService.updateTable(tableId, req.user.branchId, data);
  }

  @Delete('tables/:id')
  removeTable(@Request() req, @Param('id') tableId: string) {
    return this.restaurantService.removeTable(tableId, req.user.branchId);
  }

  @Post('tables/:id/open')
  openTable(
    @Request() req,
    @Param('id') tableId: string,
    @Body() data: { diners: number; waiterId?: string; notes?: string },
  ) {
    return this.restaurantService.openTable(tableId, req.user.branchId, data, req.user.id);
  }

  @Post('tables/:id/release')
  releaseTable(@Request() req, @Param('id') tableId: string) {
    return this.restaurantService.releaseTable(tableId, req.user.branchId);
  }

  @Get('orders')
  getOrders(@Request() req, @Query('status') status?: string) {
    return this.restaurantService.getOrders(req.user.branchId, status);
  }

  @Get('orders/:id/account')
  getOrderAccount(@Request() req, @Param('id') orderId: string) {
    return this.restaurantService.getOrderAccount(orderId, req.user.branchId);
  }

  @Post('orders/:id/items')
  addOrderItems(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { items: Array<{ productId: string; quantity: number; notes?: string }> },
  ) {
    return this.restaurantService.addOrderItems(orderId, req.user.branchId, data);
  }

  @Put('orders/:id/items/:itemId')
  updateOrderItem(
    @Request() req,
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body() data: { quantity?: number; notes?: string; status?: string },
  ) {
    return this.restaurantService.updateOrderItem(orderId, itemId, req.user.branchId, data);
  }

  @Delete('orders/:id/items/:itemId')
  removeOrderItem(
    @Request() req,
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.restaurantService.removeOrderItem(orderId, itemId, req.user.branchId);
  }

  @Put('orders/:id/waiter')
  assignWaiter(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { waiterId: string },
  ) {
    return this.restaurantService.assignWaiter(orderId, req.user.branchId, data.waiterId);
  }

  @Put('orders/:id/diners')
  updateDiners(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { diners: number },
  ) {
    return this.restaurantService.updateDiners(orderId, req.user.branchId, data.diners);
  }

  @Post('orders/:id/split-preview')
  splitPreview(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { parts: number },
  ) {
    return this.restaurantService.splitPreview(orderId, req.user.branchId, data.parts);
  }

  @Post('orders/:id/pay')
  payOrder(
    @Request() req,
    @Param('id') orderId: string,
    @Body()
    data: {
      paymentMethod: 'CASH' | 'CARD' | 'CARD_POS' | 'CARD_WEBPAY' | 'TRANSFER' | 'QR' | 'CREDIT' | 'MIXED';
      notes?: string;
      mode?: 'FULL' | 'CUSTOM';
      items?: Array<{ orderItemId: string; quantity: number }>;
    },
  ) {
    return this.restaurantService.payOrder(orderId, req.user.branchId, {
      id: req.user.id,
      role: req.user.role,
    }, data as any);
  }

  @Post('orders/:id/close')
  closeAccount(@Request() req, @Param('id') orderId: string) {
    return this.restaurantService.closeAccount(orderId, req.user.branchId);
  }

  @Put('orders/:id/status')
  updateOrderStatus(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { status: string },
  ) {
    return this.restaurantService.updateOrderStatus(orderId, req.user.branchId, data.status);
  }
}
