import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { firstValueFrom } from 'rxjs';

@Controller('management')
export class ManagementController {
  constructor(
    @Inject('MANAGEMENT_SERVICE') private managementService: ClientProxy,
  ) {}

  @Get('sliders')
  async getActiveSliders() {
    return firstValueFrom(
      this.managementService.send({ cmd: 'get_active_sliders' }, {})
    );
  }

  @Get('sliders/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async getAllSliders() {
    return firstValueFrom(
      this.managementService.send({ cmd: 'get_all_sliders' }, {})
    );
  }

  @Get('sliders/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.managementService.send({ cmd: 'get_slider' }, { id })
    );
  }

  @Post('sliders')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createDto: any) {
    return firstValueFrom(
      this.managementService.send({ cmd: 'create_slider' }, createDto)
    );
  }

  @Put('sliders/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return firstValueFrom(
      this.managementService.send({ cmd: 'update_slider' }, { id, ...updateDto })
    );
  }

  @Put('sliders/:id/reorder')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async reorder(@Param('id') id: string, @Body() body: { order: number }) {
    return firstValueFrom(
      this.managementService.send({ cmd: 'reorder_slider' }, { id, order: body.order })
    );
  }

  @Delete('sliders/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.managementService.send({ cmd: 'delete_slider' }, { id })
    );
  }

  // Section endpoints
  @Get('sections')
  async getActiveSections() {
    return firstValueFrom(
      this.managementService.send({ cmd: 'get_active_sections' }, {})
    );
  }

  @Get('sections/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async getAllSections() {
    return firstValueFrom(
      this.managementService.send({ cmd: 'get_all_sections' }, {})
    );
  }

  @Get('sections/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async findOneSection(@Param('id') id: string) {
    return firstValueFrom(
      this.managementService.send({ cmd: 'get_section' }, { id })
    );
  }

  @Post('sections')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async createSection(@Body() createDto: any) {
    return firstValueFrom(
      this.managementService.send({ cmd: 'create_section' }, createDto)
    );
  }

  @Put('sections/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async updateSection(@Param('id') id: string, @Body() updateDto: any) {
    return firstValueFrom(
      this.managementService.send({ cmd: 'update_section' }, { id, ...updateDto })
    );
  }

  @Put('sections/:id/reorder')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async reorderSection(@Param('id') id: string, @Body() body: { order: number }) {
    return firstValueFrom(
      this.managementService.send({ cmd: 'reorder_section' }, { id, order: body.order })
    );
  }

  @Delete('sections/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async removeSection(@Param('id') id: string) {
    return firstValueFrom(
      this.managementService.send({ cmd: 'delete_section' }, { id })
    );
  }
}
