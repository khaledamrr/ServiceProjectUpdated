import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Section, SectionDocument } from './schemas/section.schema';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Type for section with populated products
export interface PopulatedSection extends Omit<Section, 'productIds'> {
  _id?: any;
  productIds?: any[];
  products?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class SectionService {
  constructor(
    @InjectModel(Section.name) private sectionModel: Model<SectionDocument>,
    @Inject('PRODUCT_SERVICE') private productService: ClientProxy,
  ) {}

  // Get all active sections with populated products
  async getActiveSections() {
    const sections = await this.sectionModel
      .find({ isActive: true })
      .sort({ order: 1 })
      .exec();

    const populatedSections = await Promise.all(
      sections.map(async (section) => {
        const sectionObj = section.toObject() as PopulatedSection;
        
        if (sectionObj.type === 'products' && sectionObj.productIds?.length > 0) {
          try {
            // Fetch products from product service
            const productIdsStr = sectionObj.productIds.map(id => id.toString());
            const productsResponse = await firstValueFrom(
              this.productService.send(
                { cmd: 'get_products_by_ids' },
                { ids: productIdsStr }
              )
            );
            sectionObj.products = productsResponse.data || [];
          } catch (error) {
            console.error('Error fetching products:', error);
            sectionObj.products = [];
          }
        }

        return sectionObj;
      })
    );

    return {
      success: true,
      data: populatedSections,
    };
  }

  // Get all sections including inactive (admin)
  async getAllSections() {
    const sections = await this.sectionModel.find().sort({ order: 1 }).exec();
    return {
      success: true,
      data: sections,
    };
  }

  async findOne(id: string) {
    const section = await this.sectionModel.findById(id).exec();
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    return {
      success: true,
      data: section,
    };
  }

  async create(createData: any) {
    const section = new this.sectionModel(createData);
    await section.save();
    
    return {
      success: true,
      message: 'Section created successfully',
      data: section,
    };
  }

  async update(id: string, updateData: any) {
    const { id: _, ...dataToUpdate } = updateData;
    
    const section = await this.sectionModel
      .findByIdAndUpdate(id, dataToUpdate, { new: true })
      .exec();
    
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return {
      success: true,
      message: 'Section updated successfully',
      data: section,
    };
  }

  async remove(id: string) {
    const result = await this.sectionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Section not found');
    }
    return {
      success: true,
      message: 'Section deleted successfully',
    };
  }

  async reorder(id: string, newOrder: number) {
    const section = await this.sectionModel.findById(id).exec();
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const oldOrder = section.order;
    
    // Update orders of other sections
    if (newOrder > oldOrder) {
      await this.sectionModel.updateMany(
        { order: { $gt: oldOrder, $lte: newOrder } },
        { $inc: { order: -1 } }
      ).exec();
    } else if (newOrder < oldOrder) {
      await this.sectionModel.updateMany(
        { order: { $gte: newOrder, $lt: oldOrder } },
        { $inc: { order: 1 } }
      ).exec();
    }

    section.order = newOrder;
    await section.save();

    return {
      success: true,
      message: 'Section reordered successfully',
      data: section,
    };
  }
}
