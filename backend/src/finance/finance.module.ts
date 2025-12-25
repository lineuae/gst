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
import {
  FinanceCategory,
  FinanceCategorySchema,
} from './schemas/finance-category.schema';
import { FinanceCategoriesService } from './finance-categories.service';
import { FinanceCategoriesController } from './finance-categories.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FinancialEntry.name, schema: FinancialEntrySchema },
      { name: Sale.name, schema: SaleSchema },
      { name: FinanceCategory.name, schema: FinanceCategorySchema },
    ]),
  ],
  providers: [FinanceService, FinanceCategoriesService, RolesGuard],
  controllers: [FinanceController, FinanceCategoriesController],
})
export class FinanceModule {}
