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
  getTables(@Request() req, @Query('sector') sector?: string) {
    return this.restaurantService.getTables(req.user.branchId, { sector });
  }

  @Get('dashboard')
  getDashboard(@Request() req) {
    return this.restaurantService.getDashboard(req.user.branchId);
  }

  @Get('kds')
  getKitchenQueue(@Request() req, @Query('minWait') minWait?: string) {
    return this.restaurantService.getKitchenQueue(req.user.branchId, minWait ? Number(minWait) : 0);
  }

  @Get('reservations')
  getReservations(
    @Request() req,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.restaurantService.getReservations(req.user.branchId, { status, from, to });
  }

  @Post('reservations')
  createReservation(
    @Request() req,
    @Body()
    data: {
      customerName: string;
      customerPhone?: string;
      partySize: number;
      reservationAt: string;
      tableId?: string;
      notes?: string;
      status?: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    },
  ) {
    return this.restaurantService.createReservation(req.user.branchId, req.user.id, data as any);
  }

  @Put('reservations/:id')
  updateReservation(
    @Request() req,
    @Param('id') reservationId: string,
    @Body()
    data: {
      customerName?: string;
      customerPhone?: string;
      partySize?: number;
      reservationAt?: string;
      tableId?: string | null;
      notes?: string;
      status?: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    },
  ) {
    return this.restaurantService.updateReservation(reservationId, req.user.branchId, data as any);
  }

  @Put('reservations/:id/status')
  updateReservationStatus(
    @Request() req,
    @Param('id') reservationId: string,
    @Body() data: { status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' },
  ) {
    return this.restaurantService.updateReservationStatus(reservationId, req.user.branchId, data.status as any);
  }

  @Post('reservations/:id/seat')
  seatReservation(
    @Request() req,
    @Param('id') reservationId: string,
    @Body() data?: { waiterId?: string; notes?: string },
  ) {
    return this.restaurantService.seatReservation(reservationId, req.user.branchId, req.user.id, data);
  }

  @Post('tables')
  createTable(
    @Request() req,
    @Body() data: { number: string; capacity: number; status?: string; sector?: string },
  ) {
    return this.restaurantService.createTable(req.user.branchId, data);
  }

  @Put('tables/:id')
  updateTable(
    @Request() req,
    @Param('id') tableId: string,
    @Body() data: { number?: string; capacity?: number; status?: string; sector?: string | null },
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


