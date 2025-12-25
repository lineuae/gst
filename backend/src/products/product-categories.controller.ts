import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ProductCategoriesService } from './product-categories.service';

class CreateProductCategoryDto {
  name: string;
  color?: string;
}

class UpdateProductCategoryDto {
  name?: string;
  color?: string;
  isActive?: boolean;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly categoriesService: ProductCategoriesService) {}

  @Roles(UserRole.Manager)
  @Post()
  create(@Body() dto: CreateProductCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Roles(UserRole.Manager)
  @Get()
  findAll() {
    return this.categoriesService.findAllActive();
  }

  @Roles(UserRole.Manager)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.categoriesService.update(id, dto);
  }
}
