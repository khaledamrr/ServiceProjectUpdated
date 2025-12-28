import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern({ cmd: 'get_all_orders' })
  async getAllOrders(data: { userId: string }) {
    return this.orderService.findAll(data.userId);
  }

  @MessagePattern({ cmd: 'get_all_orders_admin' })
  async getAllOrdersAdmin() {
    return this.orderService.findAllOrders();
  }

  @MessagePattern({ cmd: 'get_order' })
  async getOrder(data: { id: string }) {
    return this.orderService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'delete_order' })
  async deleteOrder(data: { id: string }) {
    return this.orderService.delete(data.id);
  }

  @MessagePattern({ cmd: 'create_order' })
  async createOrder(data: any) {
    return this.orderService.create(data);
  }

  @MessagePattern({ cmd: 'update_order_status' })
  async updateOrderStatus(data: { id: string; status: string }) {
    return this.orderService.updateStatus(data.id, data.status);
  }

  @MessagePattern({ cmd: 'update_order_payment' })
  async updateOrderPayment(data: { id: string; paymentId: string; paymentStatus: string }) {
    return this.orderService.updatePaymentInfo(data.id, data.paymentId, data.paymentStatus);
  }
}

