import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CategoryService } from './category.service';

@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @MessagePattern({ cmd: 'get_all_categories' })
  async findAll() {
    return this.categoryService.findAll();
  }

  @MessagePattern({ cmd: 'get_category' })
  async findOne(data: { id: string }) {
    return this.categoryService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'get_category_by_slug' })
  async findBySlug(data: { slug: string }) {
    return this.categoryService.findBySlug(data.slug);
  }

  @MessagePattern({ cmd: 'create_category' })
  async create(data: any) {
    return this.categoryService.create(data);
  }

  @MessagePattern({ cmd: 'update_category' })
  async update(data: any) {
    return this.categoryService.update(data.id, data);
  }

  @MessagePattern({ cmd: 'delete_category' })
  async remove(data: { id: string }) {
    return this.categoryService.remove(data.id);
  }
}
