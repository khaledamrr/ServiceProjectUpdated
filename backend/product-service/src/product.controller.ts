import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductService } from './product.service';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern({ cmd: 'get_all_products' })
  async getAllProducts(data: any) {
    return this.productService.findAll(data);
  }

  @MessagePattern({ cmd: 'get_product' })
  async getProduct(data: { id: string }) {
    return this.productService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'create_product' })
  async createProduct(data: any) {
    return this.productService.create(data);
  }

  @MessagePattern({ cmd: 'update_product' })
  async updateProduct(data: { id: string; [key: string]: any }) {
    return this.productService.update(data.id, data);
  }

  @MessagePattern({ cmd: 'delete_product' })
  async deleteProduct(data: { id: string }) {
    return this.productService.remove(data.id);
  }

  @MessagePattern({ cmd: 'get_products_by_ids' })
  async getProductsByIds(data: { ids: string[] }) {
    return this.productService.findByIds(data.ids);
  }
}

