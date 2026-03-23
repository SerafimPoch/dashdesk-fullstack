import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UsersService) {}

  register(dto: RegisterDto) {
    const user = this.userService.findByEmail(dto.email);

    if (user) {
      throw new ConflictException();
    }

    this.userService.create(dto);

    return {
      message: `User ${dto.name} with ${dto.email} was successfully created`,
    };
  }

  login(dto: LoginDto) {
    const user = this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (dto.password !== user.password) {
      throw new UnauthorizedException();
    }

    return {
      message: 'User logged in successfully',
      accessToken: 'fake-access-token',
      user: {
        email: user.email,
      },
    };
  }

  me() {
    return {
      id: 1,
      name: 'Demo User',
      email: 'demo@example.com',
    };
  }
}
