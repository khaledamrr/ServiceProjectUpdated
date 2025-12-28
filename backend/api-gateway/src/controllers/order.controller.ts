import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Inject, Request } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '../guards/auth.guard';
import { firstValueFrom } from 'rxjs';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(
    @Inject('ORDER_SERVICE') private orderService: ClientProxy,
  ) {}

  @Get()
  async findAll(@Request() req: any) {
    return firstValueFrom(
      this.orderService.send({ cmd: 'get_all_orders' }, { userId: req.user.sub })
    );
  }

  @Get('admin/all')
  async findAllAdmin() {
    return firstValueFrom(
      this.orderService.send({ cmd: 'get_all_orders_admin' }, {})
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.orderService.send({ cmd: 'get_order' }, { id })
    );
  }

  @Post()
  async create(@Body() createDto: any, @Request() req: any) {
    return firstValueFrom(
      this.orderService.send({ cmd: 'create_order' }, { ...createDto, userId: req.user.sub })
    );
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() statusDto: any) {
    return firstValueFrom(
      this.orderService.send({ cmd: 'update_order_status' }, { id, ...statusDto })
    );
  }

  @Put(':id/payment')
  async updatePaymentInfo(@Param('id') id: string, @Body() paymentDto: any) {
    return firstValueFrom(
      this.orderService.send({ cmd: 'update_order_payment' }, { id, ...paymentDto })
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return firstValueFrom(
      this.orderService.send({ cmd: 'delete_order' }, { id })
    );
  }
}

