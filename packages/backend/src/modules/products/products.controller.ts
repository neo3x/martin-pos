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
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto, UpdateProductDto, UpdateStockDto } from './dto/create-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Request() req, @Query() filters: any) {
    return this.productsService.findAll(req.user.branchId, filters);
  }

  @Get('low-stock')
  getLowStock(@Request() req) {
    return this.productsService.getLowStockProducts(req.user.branchId);
  }

  @Get('expiring')
  getExpiring(@Request() req, @Query('days') days?: number) {
    return this.productsService.getExpiringProducts(req.user.branchId, days ? +days : 7);
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string, @Request() req) {
    return this.productsService.findByBarcode(barcode, req.user.branchId);
  }

  @Get('sku/:sku')
  findBySku(@Param('sku') sku: string, @Request() req) {
    return this.productsService.findBySku(sku, req.user.branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() createData: CreateProductDto, @Request() req) {
    return this.productsService.create({
      ...createData,
      branchId: req.user.branchId,
    });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: UpdateProductDto) {
    return this.productsService.update(id, updateData);
  }

  @Put(':id/stock')
  updateStock(
    @Param('id') id: string,
    @Body() data: UpdateStockDto,
    @Request() req
  ) {
    return this.productsService.updateStock(id, data.quantity, req.user.id, data.inputMethod as any, data.reason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
