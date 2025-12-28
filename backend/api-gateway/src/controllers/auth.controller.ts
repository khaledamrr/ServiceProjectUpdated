import { Controller, Post, Body, Inject, Get, Put, UseGuards, Request } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '../guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private authService: ClientProxy,
  ) { }

  @Post('register')
  async register(@Body() registerDto: any) {
    return firstValueFrom(
      this.authService.send({ cmd: 'register' }, registerDto)
    );
  }

  @Post('login')
  async login(@Body() loginDto: any) {
    return firstValueFrom(
      this.authService.send({ cmd: 'login' }, loginDto)
    );
  }

  @Post('validate')
  async validate(@Body() validateDto: any) {
    return firstValueFrom(
      this.authService.send({ cmd: 'validate' }, validateDto)
    );
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Request() req: any) {
    return firstValueFrom(
      this.authService.send({ cmd: 'get_profile' }, { userId: req.user.sub })
    );
  }

  @Put('profile')
  @UseGuards(AuthGuard)
  async updateProfile(@Request() req: any, @Body() updateData: { name?: string; email?: string }) {
    return firstValueFrom(
      this.authService.send({ cmd: 'update_profile' }, { userId: req.user.sub, updateData })
    );
  }

  @Put('password')
  @UseGuards(AuthGuard)
  async changePassword(@Request() req: any, @Body() body: { oldPassword: string; newPassword: string }) {
    return firstValueFrom(
      this.authService.send({ cmd: 'change_password' }, { userId: req.user.sub, oldPassword: body.oldPassword, newPassword: body.newPassword })
    );
  }
}

