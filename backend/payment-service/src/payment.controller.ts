import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern({ cmd: 'process_payment' })
  async processPayment(data: any) {
    return this.paymentService.processPayment(data);
  }

  @MessagePattern({ cmd: 'get_payment_status' })
  async getPaymentStatus(data: { orderId: string }) {
    return this.paymentService.getPaymentStatus(data.orderId);
  }

  @MessagePattern({ cmd: 'refund_payment' })
  async refundPayment(data: { paymentId: string; amount: number }) {
    return this.paymentService.refundPayment(data.paymentId, data.amount);
  }
}

