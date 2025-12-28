import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async findAll(userId: string) {
    const orders = await this.orderModel.find({ userId }).exec();
    return {
      success: true,
      data: orders,
    };
  }

  async findAllOrders() {
    // Admin endpoint - get all orders without userId filter
    const orders = await this.orderModel.find().exec();
    return {
      success: true,
      data: orders,
    };
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return {
      success: true,
      data: order,
    };
  }

  async delete(id: string) {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Order not found');
    }
    return {
      success: true,
      message: 'Order deleted successfully',
    };
  }

  async create(createData: any) {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const order = new this.orderModel({
      ...createData,
      orderNumber,
      status: 'pending',
    });
    await order.save();
    return {
      success: true,
      message: 'Order created successfully',
      data: order,
    };
  }

  async updateStatus(id: string, status: string) {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      success: true,
      message: 'Order status updated successfully',
      data: order,
    };
  }

  async updatePaymentInfo(id: string, paymentId: string, paymentStatus: string) {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { paymentId, paymentStatus }, { new: true })
      .exec();
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      success: true,
      message: 'Order payment info updated successfully',
      data: order,
    };
  }
}

