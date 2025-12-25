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
import { FinanceCategoriesService } from './finance-categories.service';

class CreateFinanceCategoryDto {
  name: string;
  color?: string;
}

class UpdateFinanceCategoryDto {
  name?: string;
  color?: string;
  isActive?: boolean;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance-categories')
export class FinanceCategoriesController {
  constructor(private readonly categoriesService: FinanceCategoriesService) {}

  @Roles(UserRole.Manager)
  @Post()
  create(@Body() dto: CreateFinanceCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Roles(UserRole.Manager)
  @Get()
  findAll() {
    return this.categoriesService.findAllActive();
  }

  @Roles(UserRole.Manager)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFinanceCategoryDto) {
    return this.categoriesService.update(id, dto);
  }
}
