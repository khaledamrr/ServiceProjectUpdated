import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { firstValueFrom } from 'rxjs';

@Controller('categories')
export class CategoryController {
  constructor(
    @Inject('CATEGORY_SERVICE') private categoryService: ClientProxy,
  ) {}

  @Get()
  async findAll() {
    return firstValueFrom(
      this.categoryService.send({ cmd: 'get_all_categories' }, {})
    );
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return firstValueFrom(
      this.categoryService.send({ cmd: 'get_category_by_slug' }, { slug })
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.categoryService.send({ cmd: 'get_category' }, { id })
    );
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createDto: any) {
    return firstValueFrom(
      this.categoryService.send({ cmd: 'create_category' }, createDto)
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return firstValueFrom(
      this.categoryService.send({ cmd: 'update_category' }, { id, ...updateDto })
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.categoryService.send({ cmd: 'delete_category' }, { id })
    );
  }
}
