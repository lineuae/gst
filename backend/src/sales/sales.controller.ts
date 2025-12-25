import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/schemas/user.schema';

class CreateSaleItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

class CreateSaleDto {
  items: CreateSaleItemDto[];
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.createSale({
      items: dto.items,
    });
  }

  @Get()
  findAll() {
    return this.salesService.listSales();
  }

  @Roles(UserRole.Manager)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesService.deleteSale(id);
  }
}
