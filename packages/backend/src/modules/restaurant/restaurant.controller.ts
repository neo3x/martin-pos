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
  ForbiddenException,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurant')
@UseGuards(JwtAuthGuard)
export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}
  private readonly adminMetricsRoles = ['SUPER_ADMIN', 'ADMIN'];
  private readonly kitchenRole = 'KITCHEN';

  private assertNotKitchen(role: string) {
    if (role === this.kitchenRole) {
      throw new ForbiddenException('Perfil cocina enfocado: esta accion no esta disponible');
    }
  }

  private assertAdminMetrics(role: string) {
    if (!this.adminMetricsRoles.includes(role)) {
      throw new ForbiddenException('Solo perfil administrador puede ver dashboard ejecutivo');
    }
  }

  @Get('tables')
  getTables(@Request() req, @Query('sector') sector?: string) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.getTables(req.user.branchId, { sector }, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Get('dashboard')
  getDashboard(@Request() req) {
    this.assertAdminMetrics(req.user.role);
    return this.restaurantService.getDashboard(req.user.branchId);
  }

  @Put('settings/tip-suggestion')
  updateTipSuggestion(
    @Request() req,
    @Body() data: { percent: number },
  ) {
    this.assertAdminMetrics(req.user.role);
    return this.restaurantService.updateTipSuggestion(req.user.branchId, Number(data.percent));
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
    this.assertNotKitchen(req.user.role);
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
    this.assertNotKitchen(req.user.role);
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
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.updateReservation(reservationId, req.user.branchId, data as any);
  }

  @Put('reservations/:id/status')
  updateReservationStatus(
    @Request() req,
    @Param('id') reservationId: string,
    @Body() data: { status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.updateReservationStatus(reservationId, req.user.branchId, data.status as any);
  }

  @Post('reservations/:id/seat')
  seatReservation(
    @Request() req,
    @Param('id') reservationId: string,
    @Body() data?: { waiterId?: string; notes?: string },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.seatReservation(reservationId, req.user.branchId, req.user.id, data);
  }

  @Post('tables')
  createTable(
    @Request() req,
    @Body() data: { number: string; capacity: number; status?: string; sector?: string },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.createTable(req.user.branchId, data);
  }

  @Put('tables/:id')
  updateTable(
    @Request() req,
    @Param('id') tableId: string,
    @Body() data: { number?: string; capacity?: number; status?: string; sector?: string | null },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.updateTable(tableId, req.user.branchId, data);
  }

  @Delete('tables/:id')
  removeTable(@Request() req, @Param('id') tableId: string) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.removeTable(tableId, req.user.branchId);
  }

  @Post('tables/:id/open')
  openTable(
    @Request() req,
    @Param('id') tableId: string,
    @Body() data: { diners: number; waiterId?: string; notes?: string },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.openTable(tableId, req.user.branchId, data, req.user.id);
  }

  @Post('tables/:id/release')
  releaseTable(@Request() req, @Param('id') tableId: string) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.releaseTable(tableId, req.user.branchId);
  }

  @Get('orders')
  getOrders(@Request() req, @Query('status') status?: string) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.getOrders(req.user.branchId, status, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Get('orders-board')
  getOrdersBoard(@Request() req, @Query('status') status?: string) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.getOrdersBoard(req.user.branchId, status, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Get('orders/:id/account')
  getOrderAccount(@Request() req, @Param('id') orderId: string) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.getOrderAccount(orderId, req.user.branchId, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Post('orders/:id/items')
  addOrderItems(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { items: Array<{ productId: string; quantity: number; notes?: string }> },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.addOrderItems(orderId, req.user.branchId, data, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Post('orders/:id/send')
  sendOrder(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data?: { targets?: Array<'KITCHEN' | 'CASHIER'> },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.sendOrder(orderId, req.user.branchId, req.user.id, data?.targets, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Put('orders/:id/items/:itemId')
  updateOrderItem(
    @Request() req,
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body() data: { quantity?: number; notes?: string; status?: string; estimatedPrepMinutes?: number },
  ) {
    if (req.user.role === this.kitchenRole && (data.quantity !== undefined || data.notes !== undefined)) {
      throw new ForbiddenException('Cocina solo puede actualizar estado de items');
    }
    return this.restaurantService.updateOrderItem(orderId, itemId, req.user.branchId, data, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Delete('orders/:id/items/:itemId')
  removeOrderItem(
    @Request() req,
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.removeOrderItem(orderId, itemId, req.user.branchId, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Put('orders/:id/waiter')
  assignWaiter(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { waiterId: string },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.assignWaiter(orderId, req.user.branchId, data.waiterId, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Put('orders/:id/diners')
  updateDiners(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { diners: number },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.updateDiners(orderId, req.user.branchId, data.diners, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Post('orders/:id/split-preview')
  splitPreview(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { parts: number },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.splitPreview(orderId, req.user.branchId, data.parts, {
      userId: req.user.id,
      role: req.user.role,
    });
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
      tipAmount?: number;
      tipPaymentMethod?: 'CASH' | 'CARD' | 'CARD_POS' | 'CARD_WEBPAY' | 'TRANSFER' | 'QR' | 'CREDIT' | 'MIXED';
    },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.payOrder(orderId, req.user.branchId, {
      id: req.user.id,
      role: req.user.role,
    }, data as any);
  }

  @Post('orders/:id/close')
  closeAccount(@Request() req, @Param('id') orderId: string) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.closeAccount(orderId, req.user.branchId, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Put('orders/:id/status')
  updateOrderStatus(
    @Request() req,
    @Param('id') orderId: string,
    @Body() data: { status: string },
  ) {
    if (req.user.role === this.kitchenRole && !['PREPARING', 'READY', 'SERVED'].includes(data.status)) {
      throw new ForbiddenException('Cocina solo puede mover pedidos a PREPARING, READY o SERVED');
    }
    return this.restaurantService.updateOrderStatus(orderId, req.user.branchId, data.status, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Get('service-requests')
  getServiceRequests(
    @Request() req,
    @Query('status') status?: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED',
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.getServiceRequests(req.user.branchId, status, {
      userId: req.user.id,
      role: req.user.role,
    });
  }

  @Put('service-requests/:id/status')
  updateServiceRequestStatus(
    @Request() req,
    @Param('id') requestId: string,
    @Body() data: { status: 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED' },
  ) {
    this.assertNotKitchen(req.user.role);
    return this.restaurantService.updateServiceRequestStatus(
      requestId,
      req.user.branchId,
      req.user.id,
      data.status,
      {
        userId: req.user.id,
        role: req.user.role,
      },
    );
  }
}


