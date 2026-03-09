import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll(@Request() req) {
    return this.categoriesService.findAll(req.user.branchId);
  }

  @Post()
  create(@Body() data: CreateCategoryDto, @Request() req) {
    return this.categoriesService.create({ ...data, branchId: req.user.branchId });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: CreateCategoryDto, @Request() req) {
    return this.categoriesService.update(id, req.user.branchId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.categoriesService.remove(id, req.user.branchId);
  }
}
