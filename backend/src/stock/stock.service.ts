import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StockMovement,
  StockMovementDocument,
  StockMovementType,
} from './schemas/stock-movement.schema';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(StockMovement.name)
    private readonly stockModel: Model<StockMovementDocument>,
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
}
