import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Slider, SliderDocument } from './schemas/slider.schema';

@Injectable()
export class ManagementService {
  private readonly baseUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';

  constructor(
    @InjectModel(Slider.name) private sliderModel: Model<SliderDocument>,
  ) {}

  private transformSlider(slider: any) {
    const sliderObj = slider.toObject ? slider.toObject() : slider;
    
    if (sliderObj.image) {
      sliderObj.image = sliderObj.image.startsWith('http') 
        ? sliderObj.image 
        : `${this.baseUrl}/uploads/${sliderObj.image}`;
    }
    
    return sliderObj;
  }

  // Get all active sliders (public)
  async getActiveSliders() {
    const sliders = await this.sliderModel
      .find({ isActive: true })
      .sort({ order: 1 })
      .exec();
    
    const transformedSliders = sliders.map(s => this.transformSlider(s));
    
    return {
      success: true,
      data: transformedSliders,
    };
  }

  // Get all sliders including inactive (admin)
  async getAllSliders() {
    const sliders = await this.sliderModel.find().sort({ order: 1 }).exec();
    const transformedSliders = sliders.map(s => this.transformSlider(s));
    
    return {
      success: true,
      data: transformedSliders,
    };
  }

  async findOne(id: string) {
    const slider = await this.sliderModel.findById(id).exec();
    if (!slider) {
      throw new NotFoundException('Slider not found');
    }
    return {
      success: true,
      data: this.transformSlider(slider),
    };
  }

  async create(createData: any) {
    const slider = new this.sliderModel(createData);
    await slider.save();
    
    return {
      success: true,
      message: 'Slider created successfully',
      data: this.transformSlider(slider),
    };
  }

  async update(id: string, updateData: any) {
    const { id: _, ...dataToUpdate } = updateData;
    
    const slider = await this.sliderModel
      .findByIdAndUpdate(id, dataToUpdate, { new: true })
      .exec();
    
    if (!slider) {
      throw new NotFoundException('Slider not found');
    }

    return {
      success: true,
      message: 'Slider updated successfully',
      data: this.transformSlider(slider),
    };
  }

  async remove(id: string) {
    const result = await this.sliderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Slider not found');
    }
    return {
      success: true,
      message: 'Slider deleted successfully',
    };
  }

  async reorder(id: string, newOrder: number) {
    const slider = await this.sliderModel.findById(id).exec();
    if (!slider) {
      throw new NotFoundException('Slider not found');
    }

    const oldOrder = slider.order;
    
    // Update orders of other sliders
    if (newOrder > oldOrder) {
      await this.sliderModel.updateMany(
        { order: { $gt: oldOrder, $lte: newOrder } },
        { $inc: { order: -1 } }
      ).exec();
    } else if (newOrder < oldOrder) {
      await this.sliderModel.updateMany(
        { order: { $gte: newOrder, $lt: oldOrder } },
        { $inc: { order: 1 } }
      ).exec();
    }

    slider.order = newOrder;
    await slider.save();

    return {
      success: true,
      message: 'Slider reordered successfully',
      data: this.transformSlider(slider),
    };
  }
}
