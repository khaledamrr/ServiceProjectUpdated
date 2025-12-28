import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe | null = null;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {
    // Initialize Stripe if API key is available
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
      });
      this.logger.log('Stripe initialized successfully');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not found. Using simulation mode. Set STRIPE_SECRET_KEY in .env for real payments.');
    }
  }

  async processPayment(data: any) {
    const { orderId, amount, paymentMethod, cardDetails, payerEmail } = data;

    // Validate Payment Method
    const validMethods = ['credit_card', 'paypal', 'debit_card'];
    if (!validMethods.includes(paymentMethod)) {
      throw new BadRequestException(`Invalid payment method. Accepted methods: ${validMethods.join(', ')}`);
    }

    // Validation logic based on method
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      if (!cardDetails || !cardDetails.number || !cardDetails.cvc) {
        throw new BadRequestException('Card details are required for card payments');
      }
      // Validate card number length
      const cleanNumber = cardDetails.number.replace(/\s+/g, '');
      if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        throw new BadRequestException('Invalid card number length');
      }
      // Validate CVC
      if (cardDetails.cvc.length < 3 || cardDetails.cvc.length > 4) {
        throw new BadRequestException('Invalid CVC');
      }
      // Validate expiry date
      if (!cardDetails.expiry || !cardDetails.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
        throw new BadRequestException('Invalid expiry date format. Use MM/YY');
      }
    } else if (paymentMethod === 'paypal') {
      if (!payerEmail) {
        throw new BadRequestException('Payer email is required for PayPal payments');
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(payerEmail)) {
        throw new BadRequestException('Invalid email format');
      }
    }

    let isPaymentSuccessful = false;
    let failureReason = null;
    let transactionId: string;
    let stripePaymentIntentId: string | null = null;

    try {
      // Use Stripe if available, otherwise simulate
      if (this.stripe && (paymentMethod === 'credit_card' || paymentMethod === 'debit_card')) {
        try {
          // Parse expiry date
          const [expMonth, expYear] = cardDetails.expiry.split('/');
          const fullYear = 2000 + parseInt(expYear, 10);
          const cleanCardNumber = cardDetails.number.replace(/\s+/g, '');

          // Create a PaymentMethod first
          const paymentMethodStripe = await this.stripe.paymentMethods.create({
            type: 'card',
            card: {
              number: cleanCardNumber,
              exp_month: parseInt(expMonth, 10),
              exp_year: fullYear,
              cvc: cardDetails.cvc,
            },
          });

          // Create and confirm payment intent
          const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            payment_method: paymentMethodStripe.id,
            confirm: true,
            description: `Order ${orderId}`,
            metadata: {
              orderId: orderId.toString(),
            },
            return_url: 'https://your-website.com/payment/return', // Required for some payment methods
          });

          stripePaymentIntentId = paymentIntent.id;
          transactionId = paymentIntent.id;
          isPaymentSuccessful = paymentIntent.status === 'succeeded';

          if (!isPaymentSuccessful) {
            failureReason = paymentIntent.last_payment_error?.message || `Payment status: ${paymentIntent.status}`;
          }

          this.logger.log(`Stripe payment processed: ${paymentIntent.id}, status: ${paymentIntent.status}`);
        } catch (stripeError: any) {
          this.logger.error(`Stripe payment error: ${stripeError.message}`);
          isPaymentSuccessful = false;
          failureReason = stripeError.message || 'Stripe payment processing failed';
          transactionId = `pi_error_${Date.now()}`;
        }
      } else {
        // Simulation mode (for PayPal or when Stripe is not configured)
        // Simulate payment processing
        isPaymentSuccessful = true;
        failureReason = null;

        // Simulate specific validations for "realism"
        if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
          const cleanNumber = cardDetails.number.replace(/\s+/g, '');
          // Test card numbers that should fail
          if (cleanNumber === '0000000000000000' || cleanNumber.startsWith('4000000000000002')) {
            isPaymentSuccessful = false;
            failureReason = 'Card declined';
          } else if (cleanNumber.startsWith('4000000000009995')) {
            isPaymentSuccessful = false;
            failureReason = 'Insufficient funds';
          }
        }

        transactionId = `pi_sim_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
        this.logger.log(`Simulated payment processed: ${transactionId}`);
      }

      // Save payment to database
      const payment = new this.paymentModel({
        orderId,
        amount,
        paymentMethod,
        transactionId,
        status: isPaymentSuccessful ? 'completed' : 'failed',
        cardLast4: cardDetails?.last4 || (cardDetails?.number ? cardDetails.number.replace(/\s+/g, '').slice(-4) : null),
        payerEmail: payerEmail,
        failureReason: failureReason,
        stripePaymentIntentId: stripePaymentIntentId || transactionId
      });

      await payment.save();
      this.logger.log(`Payment saved to database: ${payment._id}`);

      if (!isPaymentSuccessful) {
        return {
          success: false,
          message: 'Payment processing failed',
          data: {
            paymentId: payment._id,
            transactionId,
            status: 'failed',
            failureReason
          },
        };
      }

      return {
        success: true,
        message: 'Payment processed successfully',
        data: {
          paymentId: payment._id,
          transactionId,
          status: 'completed',
          amount,
        },
      };
    } catch (error: any) {
      this.logger.error(`Payment processing error: ${error.message}`, error.stack);
      
      // Try to save failed payment attempt
      try {
        const failedPayment = new this.paymentModel({
          orderId,
          amount,
          paymentMethod,
          transactionId: `pi_error_${Date.now()}`,
          status: 'failed',
          cardLast4: cardDetails?.last4 || (cardDetails?.number ? cardDetails.number.replace(/\s+/g, '').slice(-4) : null),
          payerEmail: payerEmail,
          failureReason: error.message || 'Unknown error',
        });
        await failedPayment.save();
      } catch (dbError: any) {
        this.logger.error(`Failed to save payment to database: ${dbError.message}`);
      }

      throw new BadRequestException(error.message || 'Payment processing failed');
    }
  }

  async getPaymentStatus(orderId: string) {
    const payment = await this.paymentModel.findOne({ orderId }).exec();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      data: {
        paymentId: payment._id,
        orderId: payment.orderId,
        status: payment.status,
        amount: payment.amount,
        transactionId: payment.transactionId,
        cardLast4: payment.cardLast4,
        refundAmount: payment.refundAmount,
        refundTransactionId: payment.refundTransactionId,
      },
    };
  }

  async refundPayment(paymentId: string, amount: number) {
    const payment = await this.paymentModel.findById(paymentId).exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new BadRequestException('Can only refund completed payments');
    }

    if (amount > payment.amount) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    let isRefundSuccessful = false;
    let failureReason = null;
    let refundTransactionId: string;

    try {
      // Use Stripe if available and payment was processed with Stripe
      if (this.stripe && payment.stripePaymentIntentId && payment.stripePaymentIntentId.startsWith('pi_')) {
        try {
          // Retrieve the payment intent
          const paymentIntent = await this.stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
          
          // Create refund
          const refund = await this.stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            amount: Math.round(amount * 100), // Convert to cents
            reason: 'requested_by_customer',
          });

          refundTransactionId = refund.id;
          isRefundSuccessful = refund.status === 'succeeded' || refund.status === 'pending';

          if (!isRefundSuccessful) {
            failureReason = refund.failure_reason || 'Refund failed';
          }

          this.logger.log(`Stripe refund processed: ${refund.id}, status: ${refund.status}`);
        } catch (stripeError: any) {
          this.logger.error(`Stripe refund error: ${stripeError.message}`);
          isRefundSuccessful = false;
          failureReason = stripeError.message || 'Stripe refund processing failed';
          refundTransactionId = `refund_error_${Date.now()}`;
        }
      } else {
        // Simulation mode
        isRefundSuccessful = true;
        refundTransactionId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.logger.log(`Simulated refund processed: ${refundTransactionId}`);
      }

      if (!isRefundSuccessful) {
        return {
          success: false,
          message: 'Refund processing failed',
          data: {
            paymentId: payment._id,
            status: 'failed',
            failureReason
          }
        };
      }

      // Update payment record
      payment.status = 'refunded';
      payment.refundAmount = amount;
      payment.refundTransactionId = refundTransactionId;
      await payment.save();
      this.logger.log(`Refund saved to database for payment: ${payment._id}`);

      return {
        success: true,
        message: 'Refund processed successfully',
        data: {
          paymentId: payment._id,
          refundAmount: amount,
          refundTransactionId,
        },
      };
    } catch (error: any) {
      this.logger.error(`Refund processing error: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Refund processing failed');
    }
  }
}

