import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(@Request() req) {
    return this.customersService.findAll(req.user.branchId);
  }

  @Post()
  create(@Body() data: any, @Request() req) {
    return this.customersService.create({ ...data, branchId: req.user.branchId });
  }
}
