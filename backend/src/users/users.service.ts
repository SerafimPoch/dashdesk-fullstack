import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetUsersQueryDto } from './dto/users.dto';
import { Prisma } from '@prisma/client';

interface UserData {
  name: string;
  email: string;
  passwordHash: string;
}

interface OAuthUserData {
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOAuthUser(OAuthUserData: OAuthUserData) {
    const id = crypto.randomUUID();

    const user = await this.prisma.user.create({
      data: {
        id,
        email: OAuthUserData.email,
        name: OAuthUserData.name,
        passwordHash: null,
      },
    });

    return user;
  }

  async create(userData: UserData) {
    const id = crypto.randomUUID();
    const user = await this.prisma.user.create({
      data: {
        id,
        email: userData.email,
        name: userData.name,
        passwordHash: userData.passwordHash,
      },
    });

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    return user;
  }

  async getUsers({ page, limit, search }: GetUsersQueryDto) {
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
