import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (user) {
      throw new ConflictException();
    }

    const passwordHash = await argon2.hash(dto.password);

    const createdUser = await this.userService.create({
      passwordHash,
      ...dto,
    });

    return {
      message: `User ${createdUser.name} with ${createdUser.email} was successfully created`,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isVerifiedPassword = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!isVerifiedPassword) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'User logged in successfully',
      accessToken,
      user: {
        email: user.email,
      },
    };
  }
}
