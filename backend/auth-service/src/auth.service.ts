import { Injectable, UnauthorizedException, BadRequestException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { firstValueFrom } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private httpService: HttpService,
  ) { }

  async register(data: RegisterDto) {
    // 1. Validate password strength
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
    if (!passwordRegex.test(data.password)) {
      throw new BadRequestException(
        'Password must contain at least 8 characters, including uppercase, lowercase, and numbers',
      );
    }

    // 2. Normalize email
    const normalizedEmail = data.email.toLowerCase().trim();

    // 3. Check for existing user
    const existingUser = await this.userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      // Use generic message to prevent enumeration (Finding 3)
      throw new ConflictException('Registration failed. Please check your details.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12); // Increased salt rounds (Finding 2)

    // 4. Create user with transaction (Finding 8)
    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      const user = new this.userModel({
        email: normalizedEmail,
        password: hashedPassword,
        name: data.name.trim(),
        role: 'user', // Default role
      });

      await user.save({ session });

      // Sync user profile to User Service
      await this.createUserProfile({
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      });

      await session.commitTransaction();

      const payload = { email: user.email, sub: user._id, name: user.name, role: user.role };
      const token = this.jwtService.sign(payload);

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      };
    } catch (error) {
      await session.abortTransaction();

      if (error.code === 11000) {
        throw new ConflictException('Registration failed. Please check your details.');
      }

      this.logger.error(`Registration failed: ${error.message}`);
      throw new InternalServerErrorException('Registration failed due to a system error');
    } finally {
      session.endSession();
    }
  }

  async login(data: LoginDto) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: normalizedEmail });

    // Generic error for finding 3
    const invalidCredentialsMsg = 'Invalid credentials';

    if (!user) {
      throw new UnauthorizedException(invalidCredentialsMsg);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(invalidCredentialsMsg);
    }

    const payload = { email: user.email, sub: user._id, name: user.name, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return { success: true, data: payload };
    } catch (error) {
      // Finding 10: Specific error for expiration
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  // Helper method to create user profile in User Service
  private async createUserProfile(userData: { _id: string; email: string; name: string; role: string }) {
    const userServiceUrl = process.env.USER_SERVICE_HTTP_URL || 'http://localhost:3012';

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${userServiceUrl}/users/sync`, userData)
      );
      return response.data;
    } catch (error) {
      // Finding 13: improved context
      this.logger.error(`User profile sync failed: ${error.message}`);
      throw new Error(`User profile creation failed: ${error.message}`);
    }
  }

  // Profile Management Methods
  async getProfile(userId: string) {
    try {
      const user = await this.userModel.findById(userId).select('-password').exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return {
        success: true,
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`Get profile error: ${error.message}`);
      throw error;
    }
  }

  async updateProfile(userId: string, updateData: { name?: string; email?: string }) {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // If email is being updated, check for uniqueness
      if (updateData.email && updateData.email !== user.email) {
        const normalizedEmail = updateData.email.toLowerCase().trim();
        const existingUser = await this.userModel.findOne({ email: normalizedEmail }).exec();
        if (existingUser) {
          throw new ConflictException('Email already in use');
        }
        updateData.email = normalizedEmail;
      }

      // Update user
      if (updateData.name) user.name = updateData.name;
      if (updateData.email) user.email = updateData.email;

      await user.save();

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`Update profile error: ${error.message}`);
      throw error;
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Validate new password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        throw new BadRequestException(
          'New password must contain at least 8 characters, including uppercase, lowercase, and numbers',
        );
      }

      // Hash and update password
      user.password = await bcrypt.hash(newPassword, 12);
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      this.logger.error(`Change password error: ${error.message}`);
      throw error;
    }
  }
}

