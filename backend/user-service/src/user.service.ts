import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll() {
    const users = await this.userModel.find().select('-password').exec();
    return {
      success: true,
      data: users,
    };
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      success: true,
      data: user,
    };
  }

  async update(id: string, updateData: any) {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  async remove(id: string) {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  async syncUserFromAuth(userData: { _id: string; email: string; name: string; role: string }) {
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findById(userData._id).exec();
      
      if (existingUser) {
        // Update existing user
        existingUser.email = userData.email;
        existingUser.name = userData.name;
        existingUser.role = userData.role;
        await existingUser.save();
        
        return {
          success: true,
          message: 'User profile updated successfully',
          data: existingUser,
        };
      } else {
        // Create new user profile with same _id from Auth Service
        const newUser = new this.userModel({
          _id: userData._id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        });
        await newUser.save();
        
        return {
          success: true,
          message: 'User profile created successfully',
          data: newUser,
        };
      }
    } catch (error) {
      console.error('Error syncing user from Auth Service:', error);
      return {
        success: false,
        message: 'Failed to sync user profile',
        error: error.message,
      };
    }
  }
}

