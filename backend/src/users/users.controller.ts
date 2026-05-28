import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CreateUserDto, GetUsersQueryDto } from './users.dto';
import type { UserItemDto } from './users.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getUsers(@Query() query: GetUsersQueryDto) {
    return this.users.getUsers(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createUser(@Body() dto: CreateUserDto): Promise<UserItemDto> {
    return this.users.createLocalUser(dto);
  }
}
