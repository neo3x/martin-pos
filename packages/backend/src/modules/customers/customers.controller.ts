import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(@Request() req) {
    return this.customersService.findAll(req.user.branchId);
  }

  @Post()
  create(@Body() data: CreateCustomerDto, @Request() req) {
    return this.customersService.create({ ...data, branchId: req.user.branchId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.customersService.findOne(id, req.user.branchId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: CreateCustomerDto, @Request() req) {
    return this.customersService.update(id, req.user.branchId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.customersService.remove(id, req.user.branchId);
  }
}
