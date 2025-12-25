import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FinancialEntry,
  FinancialEntryDocument,
  FinancialEntryType,
} from './schemas/financial-entry.schema';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';

export interface CreateFinancialEntryInput {
  type: FinancialEntryType;
  amount: number;
  category: string;
  categoryId?: string;
  description?: string;
  userId?: string;
}

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(FinancialEntry.name)
    private readonly entryModel: Model<FinancialEntryDocument>,
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
  ) {}

  async createEntry(
    input: CreateFinancialEntryInput,
  ): Promise<FinancialEntryDocument> {
    const created = new this.entryModel(input);
    return created.save();
  }

  async listEntries(): Promise<FinancialEntryDocument[]> {
    return this.entryModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateEntry(
    id: string,
    input: Partial<CreateFinancialEntryInput>,
  ): Promise<FinancialEntryDocument> {
    const updated = await this.entryModel
      .findByIdAndUpdate(id, input, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Financial entry not found');
    }
    return updated;
  }

  async deleteEntry(id: string): Promise<void> {
    const res = await this.entryModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Financial entry not found');
    }
  }

  async resetAll(): Promise<void> {
    await this.entryModel.deleteMany({}).exec();
    await this.saleModel.deleteMany({}).exec();
  }

  async getDashboardSummary(params: {
    from?: Date;
    to?: Date;
  }): Promise<{
    from: Date | null;
    to: Date | null;
    salesRevenue: number;
    otherIncome: number;
    expenses: number;
    netResult: number;
  }> {
    const { from, to } = params;

    const dateFilter: any = {};
    if (from) {
      dateFilter.$gte = from;
    }
    if (to) {
      dateFilter.$lte = to;
    }

    const saleMatch: any = {};
    if (from || to) {
      saleMatch.createdAt = dateFilter;
    }

    const entryMatch: any = {};
    if (from || to) {
      entryMatch.createdAt = dateFilter;
    }

    const salesAgg = await this.saleModel
      .aggregate([
        { $match: saleMatch },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ])
      .exec();
    const salesRevenue = salesAgg[0]?.total ?? 0;

    const entries = await this.entryModel.find(entryMatch).exec();
    let otherIncome = 0;
    let expenses = 0;
    for (const e of entries) {
      if (e.type === FinancialEntryType.Income) {
        otherIncome += e.amount;
      } else if (e.type === FinancialEntryType.Expense) {
        expenses += e.amount;
      }
    }

    const netResult = salesRevenue + otherIncome - expenses;

    return {
      from: from ?? null,
      to: to ?? null,
      salesRevenue,
      otherIncome,
      expenses,
      netResult,
    };
  }
}
