import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductCategory,
  ProductCategoryDocument,
} from './schemas/product-category.schema';

const DEFAULT_PRODUCT_CATEGORIES: Array<Partial<ProductCategory>> = [
  { name: 'Boîtes / coffrets', color: '#0ea5e9', isActive: true },
  { name: 'Sacs / pochettes', color: '#22c55e', isActive: true },
  { name: 'Rubans / nœuds', color: '#6366f1', isActive: true },
  { name: 'Décoration de table', color: '#f97316', isActive: true },
  { name: 'Décoration salle', color: '#a855f7', isActive: true },
  { name: 'Accessoires divers', color: '#64748b', isActive: true },
];

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectModel(ProductCategory.name)
    private readonly categoryModel: Model<ProductCategoryDocument>,
  ) {}

  private async ensureDefaultCategories(): Promise<void> {
    for (const def of DEFAULT_PRODUCT_CATEGORIES) {
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

  async create(data: Partial<ProductCategory>): Promise<ProductCategoryDocument> {
    const created = new this.categoryModel(data);
    return created.save();
  }

  async findAllActive(): Promise<ProductCategoryDocument[]> {
    await this.ensureDefaultCategories();
    return this.categoryModel
      .find({ isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  async update(
    id: string,
    data: Partial<ProductCategory>,
  ): Promise<ProductCategoryDocument> {
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Product category not found');
    }
    return updated;
  }
}
