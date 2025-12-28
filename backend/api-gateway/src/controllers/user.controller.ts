import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { firstValueFrom } from 'rxjs';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private userService: ClientProxy,
  ) {}

  @Get()
  @Roles('admin')
  async findAll() {
    return firstValueFrom(
      this.userService.send({ cmd: 'get_all_users' }, {})
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.userService.send({ cmd: 'get_user' }, { id })
    );
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return firstValueFrom(
      this.userService.send({ cmd: 'update_user' }, { id, ...updateDto })
    );
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.userService.send({ cmd: 'delete_user' }, { id })
    );
  }
}

