import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';

const logger = new Logger('AppModule');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/payment-service', {
      retryWrites: true,
      w: 'majority',
      retryReads: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }),
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class AppModule {
  constructor() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/payment-service';
    logger.log(`MongoDB URI configured: ${mongoUri.replace(/:[^:]*@/, ':****@')}`);
    
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('STRIPE_SECRET_KEY not set. Payment service will run in simulation mode.');
      logger.warn('To enable real Stripe payments, set STRIPE_SECRET_KEY in your .env file.');
    } else {
      logger.log('Stripe integration enabled');
    }
  }
}

