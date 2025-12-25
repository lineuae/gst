import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import {
  FinancialEntry,
  FinancialEntrySchema,
} from './schemas/financial-entry.schema';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FinancialEntry.name, schema: FinancialEntrySchema },
      { name: Sale.name, schema: SaleSchema },
    ]),
  ],
  providers: [FinanceService, RolesGuard],
  controllers: [FinanceController],
})
export class FinanceModule {}
