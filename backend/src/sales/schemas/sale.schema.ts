import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentMethod {
  Cash = 'cash',
  Wave = 'wave',
  Card = 'card',
}

export type SaleDocument = Sale & Document;

@Schema({ timestamps: true })
export class SaleItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;
}

const SaleItemSchema = SchemaFactory.createForClass(SaleItem);

@Schema({ timestamps: true })
export class Sale {
  @Prop({ type: [SaleItemSchema], default: [] })
  items: SaleItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ type: String, required: false })
  userId?: string;

  @Prop({ type: String, required: false })
  username?: string;

  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
