import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { firstValueFrom } from 'rxjs';

@Controller('products')
export class ProductController {
  constructor(
    @Inject('PRODUCT_SERVICE') private productService: ClientProxy,
  ) {}

  @Get()
  async findAll(@Query() query: any) {
    return firstValueFrom(
      this.productService.send({ cmd: 'get_all_products' }, query)
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.productService.send({ cmd: 'get_product' }, { id })
    );
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createDto: any) {
    return firstValueFrom(
      this.productService.send({ cmd: 'create_product' }, createDto)
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return firstValueFrom(
      this.productService.send({ cmd: 'update_product' }, { id, ...updateDto })
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.productService.send({ cmd: 'delete_product' }, { id })
    );
  }
}
