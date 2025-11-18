import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private transfersService: TransfersService) {}

  @Post()
  create(@Body() data: any, @Request() req) {
    return this.transfersService.createTransfer(data, req.user.id);
  }

  @Put(':id/send')
  send(@Param('id') id: string) {
    return this.transfersService.sendTransfer(id);
  }

  @Put(':id/receive')
  receive(@Param('id') id: string) {
    return this.transfersService.receiveTransfer(id);
  }
}
