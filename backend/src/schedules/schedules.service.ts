import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@prisma/client';
import { getUtcDayRange } from '../common/date/date-only';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateScheduleDto,
  GetSchedulesQueryDto,
  ScheduleItemDto,
  SchedulesListDto,
} from './schedules.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: Pick<PrismaClient, 'schedule'>,
  ) {}

  private readonly scheduleSelect = {
    id: true,
    title: true,
    startsAt: true,
    endsAt: true,
    location: true,
    accent: true,
  } satisfies Prisma.ScheduleSelect;

  async getSchedules(
    userId: string,
    query: GetSchedulesQueryDto,
  ): Promise<SchedulesListDto> {
    const dateFilter = query.date ? getUtcDayRange(query.date) : null;
    const where: Prisma.ScheduleWhereInput = {
      userId,
      ...(dateFilter
        ? {
            startsAt: {
              gte: dateFilter.startsAt,
              lt: dateFilter.endsBefore,
            },
          }
        : {}),
    };

    const items = await this.prisma.schedule.findMany({
      where,
      select: this.scheduleSelect,
      orderBy: {
        startsAt: 'asc',
      },
    });

    return { items };
  }

  async createSchedule(
    userId: string,
    dto: CreateScheduleDto,
  ): Promise<ScheduleItemDto> {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('End time must be after start time');
    }

    return this.prisma.schedule.create({
      data: {
        userId,
        title: dto.title,
        startsAt,
        endsAt,
        location: dto.location,
        accent: dto.accent,
      },
      select: this.scheduleSelect,
    });
  }
}
