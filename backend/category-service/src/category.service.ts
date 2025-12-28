import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoryService {
  private readonly baseUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private transformCategory(category: any) {
    const categoryObj = category.toObject ? category.toObject() : category;
    
    if (categoryObj.image) {
      categoryObj.image = categoryObj.image.startsWith('http') 
        ? categoryObj.image 
        : `${this.baseUrl}/uploads/${categoryObj.image}`;
    }
    
    return categoryObj;
  }

  async findAll() {
    const categories = await this.categoryModel.find({ isActive: true }).exec();
    const transformedCategories = categories.map(c => this.transformCategory(c));
    
    return {
      success: true,
      data: transformedCategories,
    };
  }

  async findOne(id: string) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return {
      success: true,
      data: this.transformCategory(category),
    };
  }

  async findBySlug(slug: string) {
    const category = await this.categoryModel.findOne({ slug, isActive: true }).exec();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return {
      success: true,
      data: this.transformCategory(category),
    };
  }

  async create(createData: any) {
    const slug = this.generateSlug(createData.name);
    
    // Check if category with same name or slug exists
    const existing = await this.categoryModel.findOne({
      $or: [{ name: createData.name }, { slug }]
    }).exec();
    
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = new this.categoryModel({
      ...createData,
      slug,
    });
    
    await category.save();
    
    return {
      success: true,
      message: 'Category created successfully',
      data: this.transformCategory(category),
    };
  }

  async update(id: string, updateData: any) {
    const { id: _, ...dataToUpdate } = updateData;
    
    // If name is being updated, regenerate slug
    if (dataToUpdate.name) {
      dataToUpdate.slug = this.generateSlug(dataToUpdate.name);
    }
    
    const category = await this.categoryModel
      .findByIdAndUpdate(id, dataToUpdate, { new: true })
      .exec();
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      success: true,
      message: 'Category updated successfully',
      data: this.transformCategory(category),
    };
  }

  async remove(id: string) {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Category not found');
    }
    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }
}
