import { Body, Controller, Delete, Get, Param, Post, UseGuards, Req } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { PaymentMethod } from './schemas/sale.schema';

class CreateSaleItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

class CreateSaleDto {
  items: CreateSaleItemDto[];
  paymentMethod: PaymentMethod;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() dto: CreateSaleDto, @Req() req: any) {
    return this.salesService.createSale({
      items: dto.items,
      userId: req.user?.userId,
      username: req.user?.username,
      paymentMethod: dto.paymentMethod,
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
