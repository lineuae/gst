import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StockMovementType } from './schemas/stock-movement.schema';

class AdjustStockDto {
  productId: string;
  quantity: number; // positif = entrée, négatif = sortie
  note?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

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
