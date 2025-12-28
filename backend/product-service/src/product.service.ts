import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductService {
  private readonly baseUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  private transformProduct(product: any) {
    const productObj = product.toObject ? product.toObject() : product;
    
    if (productObj.images && productObj.images.length > 0) {
      productObj.images = productObj.images.map((img: string) => 
        img.startsWith('http') ? img : `${this.baseUrl}/uploads/${img}`
      );
    }
    
    if (productObj.coverImage) {
      productObj.coverImage = productObj.coverImage.startsWith('http') 
        ? productObj.coverImage 
        : `${this.baseUrl}/uploads/${productObj.coverImage}`;
    }
    
    // Build category object from denormalized fields
    if (productObj.categoryId) {
      productObj.category = {
        _id: productObj.categoryId,
        name: productObj.categoryName || '',
        slug: productObj.categorySlug || '',
      };
      // Keep categoryId for backward compatibility but also include denormalized data
    }
    
    return productObj;
  }

  async findAll(query: any = {}) {
    const { category, minPrice, maxPrice, search } = query;
    const filter: any = {};

    if (category) {
      filter.categoryId = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await this.productModel
      .find(filter)
      .exec();
    const transformedProducts = products.map(p => this.transformProduct(p));
    
    return {
      success: true,
      data: transformedProducts,
    };
  }

  async findOne(id: string) {
    const product = await this.productModel
      .findById(id)
      .exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return {
      success: true,
      data: this.transformProduct(product),
    };
  }

  async create(createData: any) {
    const product = new this.productModel(createData);
    await product.save();
    return {
      success: true,
      message: 'Product created successfully',
      data: this.transformProduct(product),
    };
  }

  async update(id: string, updateData: any) {
    const { id: _, ...dataToUpdate } = updateData;
    const product = await this.productModel
      .findByIdAndUpdate(id, dataToUpdate, { new: true })
      .exec();
    
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      success: true,
      message: 'Product updated successfully',
      data: this.transformProduct(product),
    };
  }

  async remove(id: string) {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Product not found');
    }
    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  async findByIds(ids: string[]) {
    try {
      const products = await this.productModel
        .find({ _id: { $in: ids } })
        .exec();
      
      const transformedProducts = products.map(p => this.transformProduct(p));
      
      return {
        success: true,
        data: transformedProducts,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
      };
    }
  }
}

