import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['credit_card', 'paypal', 'debit_card'] })
  paymentMethod: string;

  @Prop({ required: true })
  transactionId: string;

  @Prop()
  stripePaymentIntentId: string;

  @Prop({
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  })
  status: string;

  @Prop()
  failureReason: string;

  @Prop()
  payerEmail: string;

  @Prop()
  cardLast4: string;

  @Prop()
  refundAmount: number;

  @Prop()
  refundTransactionId: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

