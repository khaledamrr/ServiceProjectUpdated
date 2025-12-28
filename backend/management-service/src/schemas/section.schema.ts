import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SectionDocument = Section & Document;

@Schema({ timestamps: true })
export class Section {
  @Prop({ required: true })
  title: string;

  @Prop()
  subtitle: string;

  @Prop({ required: true, enum: ['products', 'categories', 'custom'], default: 'products' })
  type: string;

  @Prop({ required: true, enum: ['grid', 'carousel', 'list'], default: 'grid' })
  displayStyle: string;

  @Prop({ type: [Types.ObjectId], default: [] })
  productIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ default: 8 })
  limit: number;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const SectionSchema = SchemaFactory.createForClass(Section);
