import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FinanceCategory,
  FinanceCategoryDocument,
} from './schemas/finance-category.schema';

const DEFAULT_FINANCE_CATEGORIES: Array<Partial<FinanceCategory>> = [
  // Entrées
  { name: 'Ventes produits', color: '#22c55e', isActive: true },
  { name: 'Location décoration', color: '#0ea5e9', isActive: true },
  { name: 'Acomptes clients', color: '#6366f1', isActive: true },
  { name: 'Autres entrées', color: '#4ade80', isActive: true },
  // Dépenses
  { name: 'Achat stock packaging', color: '#f97316', isActive: true },
  { name: 'Décoration / consommables', color: '#facc15', isActive: true },
  { name: 'Transport / livraison', color: '#06b6d4', isActive: true },
  { name: 'Salaires / prestataires', color: '#a855f7', isActive: true },
  { name: 'Loyer / charges boutique', color: '#fb7185', isActive: true },
  { name: 'Marketing / communication', color: '#3b82f6', isActive: true },
  { name: 'Divers', color: '#64748b', isActive: true },
];

@Injectable()
export class FinanceCategoriesService {
  constructor(
    @InjectModel(FinanceCategory.name)
    private readonly categoryModel: Model<FinanceCategoryDocument>,
  ) {}

  private async ensureDefaultCategories(): Promise<void> {
    for (const def of DEFAULT_FINANCE_CATEGORIES) {
      await this.categoryModel
        .updateOne(
          { name: def.name },
          {
            $set: {
              ...def,
              isActive: true,
            },
          },
          { upsert: true },
        )
        .exec();
    }
  }

  async create(data: Partial<FinanceCategory>): Promise<FinanceCategoryDocument> {
    const created = new this.categoryModel(data);
    return created.save();
  }

  async findAllActive(): Promise<FinanceCategoryDocument[]> {
    await this.ensureDefaultCategories();
    return this.categoryModel
      .find({ isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async update(
    id: string,
    data: Partial<FinanceCategory>,
  ): Promise<FinanceCategoryDocument> {
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Finance category not found');
    }
    return updated;
  }
}
