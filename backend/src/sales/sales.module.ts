import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { RolesGuard } from '../auth/roles.guard';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { ProductsModule } from '../products/products.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }]),
    ProductsModule,
    StockModule,
  ],
  providers: [SalesService, RolesGuard],
  controllers: [SalesController],
})
export class SalesModule {}
