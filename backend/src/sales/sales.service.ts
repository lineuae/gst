import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentMethod, Sale, SaleDocument } from './schemas/sale.schema';
import { StockService } from '../stock/stock.service';
import { StockMovementType } from '../stock/schemas/stock-movement.schema';

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleInput {
  items: CreateSaleItemInput[];
  userId?: string;
  paymentMethod: PaymentMethod;
  username?: string;
}

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
    private readonly stockService: StockService,
  ) {}

  async createSale(input: CreateSaleInput): Promise<SaleDocument> {
    const items = input.items.map((item) => ({
      product: new Types.ObjectId(item.productId),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const sale = new this.saleModel({
      items,
      totalAmount,
      userId: input.userId,
      username: input.username,
      paymentMethod: input.paymentMethod,
    });

    const saved = await sale.save();

    // Mettre à jour le stock : chaque vente crée un mouvement négatif
    for (const item of input.items) {
      await this.stockService.addMovement({
        productId: item.productId,
        quantity: -Math.abs(item.quantity),
        type: StockMovementType.Sale,
        userId: input.userId,
        note: 'Vente',
      });
    }

    return saved;
  }

  async listSales(): Promise<SaleDocument[]> {
    return this.saleModel
      .find()
      .sort({ createdAt: -1 })
      .populate('items.product', 'name price')
      .exec();
  }

  async deleteSale(id: string): Promise<void> {
    const sale = await this.saleModel.findById(id).exec();
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // Restaurer le stock pour chaque article de la vente supprimée
    for (const item of sale.items) {
      await this.stockService.addMovement({
        productId: (item as any).product.toString(),
        quantity: Math.abs(item.quantity),
        type: StockMovementType.ManualAdjustment,
        userId: sale.userId,
        note: 'Annulation vente',
      });
    }

    await this.saleModel.findByIdAndDelete(id).exec();
  }
}
