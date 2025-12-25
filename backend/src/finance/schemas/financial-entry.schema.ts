import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FinancialEntryDocument = FinancialEntry & Document;

export enum FinancialEntryType {
  Income = 'income',
  Expense = 'expense',
}

@Schema({ timestamps: true })
export class FinancialEntry {
  @Prop({ enum: FinancialEntryType, required: true })
  type: FinancialEntryType;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  category: string;

  @Prop({ type: String, required: false })
  categoryId?: string;

  @Prop()
  description?: string;

  @Prop({ type: String, required: false })
  userId?: string;
}

export const FinancialEntrySchema = SchemaFactory.createForClass(FinancialEntry);
