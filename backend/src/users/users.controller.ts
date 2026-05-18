import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetUsersQueryDto } from './users.dto';
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
}
