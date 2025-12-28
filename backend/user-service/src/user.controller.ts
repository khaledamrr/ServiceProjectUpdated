import { Controller, Post, Body } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: 'get_all_users' })
  async getAllUsers() {
    return this.userService.findAll();
  }

  @MessagePattern({ cmd: 'get_user' })
  async getUser(data: { id: string }) {
    return this.userService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'update_user' })
  async updateUser(data: { id: string; name?: string; email?: string; phone?: string; address?: any }) {
    return this.userService.update(data.id, data);
  }

  @MessagePattern({ cmd: 'delete_user' })
  async deleteUser(data: { id: string }) {
    return this.userService.remove(data.id);
  }

  // HTTP endpoint for syncing user from Auth Service
  @Post('users/sync')
  async syncUser(@Body() userData: { _id: string; email: string; name: string; role: string }) {
    return this.userService.syncUserFromAuth(userData);
  }
}

