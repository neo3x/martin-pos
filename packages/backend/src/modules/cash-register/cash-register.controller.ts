import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cash-register')
@UseGuards(JwtAuthGuard)
export class CashRegisterController {
  constructor(private cashRegisterService: CashRegisterService) {}

  @Get('current')
  getCurrentRegister(@Request() req) {
    return this.cashRegisterService.getCurrentRegister(req.user.id, req.user.branchId);
  }

  @Post('open')
  open(@Body() data: { initialCash: number }, @Request() req) {
    return this.cashRegisterService.open(req.user.id, req.user.branchId, data.initialCash);
  }

  @Put(':id/close')
  close(@Param('id') id: string, @Body() data: { finalCash: number }) {
    return this.cashRegisterService.close(id, data.finalCash);
  }
}
