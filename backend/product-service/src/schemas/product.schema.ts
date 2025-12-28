import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: String })
  categoryId: string;

  @Prop({ type: String })
  categoryName: string;

  @Prop({ type: String })
  categorySlug: string;

  @Prop({ required: true })
  stock: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: String })
  coverImage: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  specifications: Record<string, any>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

