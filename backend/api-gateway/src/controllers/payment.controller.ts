import { Controller, Post, Get, Body, Param, UseGuards, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '../guards/auth.guard';
import { firstValueFrom } from 'rxjs';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentController {
  constructor(
    @Inject('PAYMENT_SERVICE') private paymentService: ClientProxy,
  ) {}

  @Post('process')
  async processPayment(@Body() paymentDto: any) {
    return firstValueFrom(
      this.paymentService.send({ cmd: 'process_payment' }, paymentDto)
    );
  }

  @Get(':orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    return firstValueFrom(
      this.paymentService.send({ cmd: 'get_payment_status' }, { orderId })
    );
  }

  @Post('refund')
  async refundPayment(@Body() refundDto: any) {
    return firstValueFrom(
      this.paymentService.send({ cmd: 'refund_payment' }, refundDto)
    );
  }
}

