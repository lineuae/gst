import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';

export type StockMovementDocument = StockMovement & Document;

export enum StockMovementType {
  Purchase = 'purchase',
  Sale = 'sale',
  ManualAdjustment = 'manual_adjustment',
}

@Schema({ timestamps: true })
export class StockMovement {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  quantity: number; // positif = entrée, négatif = sortie

  @Prop({ enum: StockMovementType, required: true })
  type: StockMovementType;

  @Prop({ type: String, required: false })
  userId?: string; // id de l'utilisateur qui a fait le mouvement

  @Prop()
  note?: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
