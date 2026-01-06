import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductCategory,
  ProductCategoryDocument,
} from './schemas/product-category.schema';

const DEFAULT_PRODUCT_CATEGORIES: Array<Partial<ProductCategory>> = [
  { name: 'Packaging', isActive: true },
  { name: 'Bouteilles', isActive: true },
  { name: 'Barquette', isActive: true },
  { name: 'Box et sachets beignets', isActive: true },
  { name: 'Décoration', isActive: true },
  { name: 'Vaisselle', isActive: true },
  { name: 'Rubans', isActive: true },
  { name: 'Gobelet', isActive: true },
  { name: 'Couvert F-C-C🥄🍴', isActive: true },
  { name: 'Déco modèle', isActive: true },
  { name: 'Verine', isActive: true },
  { name: 'fleurs', isActive: true },
  { name: 'Mouchoirs', isActive: true },
  { name: 'Présentoirs', isActive: true },
  { name: 'Amballage', isActive: true },
  { name: 'Ballons', isActive: true },
  { name: 'Boîtes et coffret', isActive: true },
  { name: 'Autres', isActive: true },
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
