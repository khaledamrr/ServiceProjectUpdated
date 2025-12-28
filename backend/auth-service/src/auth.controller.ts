import { Controller, UseGuards, UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RpcThrottlerGuard } from './guards/rpc-throttler.guard';
import { HttpRpcExceptionFilter } from './filters/http-rpc-exception.filter';

@Controller()
@UseGuards(RpcThrottlerGuard)
@UseFilters(HttpRpcExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @MessagePattern({ cmd: 'register' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Payload() data: RegisterDto) {
    return this.authService.register(data);
  }

  @MessagePattern({ cmd: 'login' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Payload() data: LoginDto) {
    return this.authService.login(data);
  }

  @MessagePattern({ cmd: 'validate' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async validate(@Payload() data: ValidateTokenDto) {
    return this.authService.validateToken(data.token);
  }

  @MessagePattern({ cmd: 'get_profile' })
  async getProfile(@Payload() data: { userId: string }) {
    return this.authService.getProfile(data.userId);
  }

  @MessagePattern({ cmd: 'update_profile' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateProfile(@Payload() data: { userId: string; updateData: UpdateProfileDto }) {
    return this.authService.updateProfile(data.userId, data.updateData);
  }

  @MessagePattern({ cmd: 'change_password' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async changePassword(@Payload() data: { userId: string; oldPassword: string; newPassword: string }) {
    return this.authService.changePassword(data.userId, data.oldPassword, data.newPassword);
  }
}

