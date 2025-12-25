import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FinanceCategoryDocument = FinanceCategory & Document;

@Schema({ timestamps: true })
export class FinanceCategory {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: false, trim: true })
  color?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const FinanceCategorySchema = SchemaFactory.createForClass(FinanceCategory);
