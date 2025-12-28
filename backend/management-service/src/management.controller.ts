import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ManagementService } from './management.service';
import { SectionService } from './section.service';

@Controller()
export class ManagementController {
  constructor(
    private readonly managementService: ManagementService,
    private readonly sectionService: SectionService,
  ) {}

  // Slider endpoints
  @MessagePattern({ cmd: 'get_active_sliders' })
  async getActiveSliders() {
    return this.managementService.getActiveSliders();
  }

  @MessagePattern({ cmd: 'get_all_sliders' })
  async getAllSliders() {
    return this.managementService.getAllSliders();
  }

  @MessagePattern({ cmd: 'get_slider' })
  async findOneSlider(data: { id: string }) {
    return this.managementService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'create_slider' })
  async createSlider(data: any) {
    return this.managementService.create(data);
  }

  @MessagePattern({ cmd: 'update_slider' })
  async updateSlider(data: any) {
    return this.managementService.update(data.id, data);
  }

  @MessagePattern({ cmd: 'delete_slider' })
  async removeSlider(data: { id: string }) {
    return this.managementService.remove(data.id);
  }

  @MessagePattern({ cmd: 'reorder_slider' })
  async reorderSlider(data: { id: string; order: number }) {
    return this.managementService.reorder(data.id, data.order);
  }

  // Section endpoints
  @MessagePattern({ cmd: 'get_active_sections' })
  async getActiveSections() {
    return this.sectionService.getActiveSections();
  }

  @MessagePattern({ cmd: 'get_all_sections' })
  async getAllSections() {
    return this.sectionService.getAllSections();
  }

  @MessagePattern({ cmd: 'get_section' })
  async findOneSection(data: { id: string }) {
    return this.sectionService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'create_section' })
  async createSection(data: any) {
    return this.sectionService.create(data);
  }

  @MessagePattern({ cmd: 'update_section' })
  async updateSection(data: any) {
    return this.sectionService.update(data.id, data);
  }

  @MessagePattern({ cmd: 'delete_section' })
  async removeSection(data: { id: string }) {
    return this.sectionService.remove(data.id);
  }

  @MessagePattern({ cmd: 'reorder_section' })
  async reorderSection(data: { id: string; order: number }) {
    return this.sectionService.reorder(data.id, data.order);
  }
}
