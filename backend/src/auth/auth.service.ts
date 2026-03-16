import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  register(dto: RegisterDto) {
    return {
      message: 'User registered successfully',
      user: {
        name: dto.name,
        email: dto.email,
      },
    };
  }

  login(dto: LoginDto) {
    return {
      message: 'User logged in successfully',
      accessToken: 'fake-access-token',
      user: {
        email: dto.email,
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
