import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StockMovementType } from './schemas/stock-movement.schema';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/schemas/user.schema';

class AdjustStockDto {
  productId: string;
  quantity: number; // positif = entrée, négatif = sortie
  note?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Roles(UserRole.Manager, UserRole.Admin)
  @Post('adjust')
  adjust(@Body() dto: AdjustStockDto) {
    const type = StockMovementType.ManualAdjustment;
    return this.stockService.addMovement({
      productId: dto.productId,
      quantity: dto.quantity,
      type,
      note: dto.note,
    });
  }

  @Get('product/:productId')
  getStock(@Param('productId') productId: string) {
    return this.stockService.getStockForProduct(productId);
  }
}
