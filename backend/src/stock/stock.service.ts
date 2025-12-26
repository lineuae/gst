import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StockMovement,
  StockMovementDocument,
  StockMovementType,
} from './schemas/stock-movement.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(StockMovement.name)
    private readonly stockModel: Model<StockMovementDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async addMovement(options: {
    productId: string;
    quantity: number;
    type: StockMovementType;
    userId?: string;
    note?: string;
  }): Promise<StockMovementDocument> {
    const created = new this.stockModel({
      product: new Types.ObjectId(options.productId),
      quantity: options.quantity,
      type: options.type,
      userId: options.userId,
      note: options.note,
    });
    return created.save();
  }

  async getStockForProduct(productId: string): Promise<number> {
    const result = await this.stockModel
      .aggregate([
        { $match: { product: new Types.ObjectId(productId) } },
        { $group: { _id: '$product', total: { $sum: '$quantity' } } },
      ])
      .exec();

    if (!result.length) {
      return 0;
    }
    return result[0].total ?? 0;
  }

  async getLowStockProducts(options?: {
    min?: number;
    max?: number;
  }): Promise<
    {
      productId: string;
      name: string;
      price: number;
      imageUrl?: string;
      description?: string;
      stock: number;
    }[]
  > {
    const min = options?.min ?? 0;
    const max = options?.max ?? 10;

    const pipeline: any[] = [
      {
        $match: {
          $or: [{ isActive: { $exists: false } }, { isActive: { $ne: false } }],
        },
      },
      {
        $lookup: {
          from: this.stockModel.collection.name,
          localField: '_id',
          foreignField: 'product',
          as: 'movements',
        },
      },
      {
        $addFields: {
          stock: {
            $cond: [
              { $gt: [{ $size: '$movements' }, 0] },
              { $sum: '$movements.quantity' },
              0,
            ],
          },
        },
      },
      {
        $match: {
          stock: {
            $lte: max,
            $gte: min,
          },
        },
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: 1,
          price: 1,
          imageUrl: 1,
          description: 1,
          stock: 1,
        },
      },
      {
        $sort: { stock: 1, name: 1 },
      },
    ];

    return this.productModel.aggregate(pipeline).exec();
  }
}
