import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductCategoryDocument = ProductCategory & Document;

@Schema({ timestamps: true })
export class ProductCategory {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: false, trim: true })
  color?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductCategorySchema = SchemaFactory.createForClass(ProductCategory);
