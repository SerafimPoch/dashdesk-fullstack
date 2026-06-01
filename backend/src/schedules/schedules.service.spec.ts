import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import { ScheduleAccent } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateScheduleDto } from './schedules.dto';
import { GetSchedulesQueryDto } from './schedules.dto';
import { SchedulesService } from './schedules.service';

type PrismaMock = {
  schedule: {
    create: ReturnType<typeof jest.fn>;
    findMany: ReturnType<typeof jest.fn>;
  };
};

function createPrismaMock(): PrismaMock {
  return {
    schedule: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

function createService() {
  const prisma = createPrismaMock();
  const service = new SchedulesService(prisma as unknown as PrismaService);

  return { prisma, service };
}

function createQuery(
  overrides: Partial<GetSchedulesQueryDto> = {},
): GetSchedulesQueryDto {
  return Object.assign(new GetSchedulesQueryDto(), overrides);
}

describe('SchedulesService', () => {
  describe('getSchedules', () => {
    it('returns schedules ordered by start time for the user', async () => {
      const { prisma, service } = createService();
      const items = [
        {
          id: 'schedule-1',
          title: 'Product review',
          startsAt: new Date('2026-05-28T09:00:00.000Z'),
          endsAt: new Date('2026-05-28T10:00:00.000Z'),
          location: 'Conference Room',
          accent: ScheduleAccent.GREEN,
        },
      ];

      prisma.schedule.findMany.mockResolvedValue(items);

      await expect(
        service.getSchedules('user-1', createQuery()),
      ).resolves.toEqual({
        items,
      });
      expect(prisma.schedule.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          location: true,
          accent: true,
        },
        orderBy: {
          startsAt: 'asc',
        },
      });
    });

    it('filters schedules by an inclusive UTC day start and exclusive next-day bound', async () => {
      const { prisma, service } = createService();

      prisma.schedule.findMany.mockResolvedValue([]);

      await expect(
        service.getSchedules('user-1', createQuery({ date: '2026-05-28' })),
      ).resolves.toEqual({ items: [] });
      expect(prisma.schedule.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          startsAt: {
            gte: new Date('2026-05-28T00:00:00.000Z'),
            lt: new Date('2026-05-29T00:00:00.000Z'),
          },
        },
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          location: true,
          accent: true,
        },
        orderBy: {
          startsAt: 'asc',
        },
      });
    });

    it('rejects invalid date filters before querying Prisma', async () => {
      const { prisma, service } = createService();

      await expect(
        service.getSchedules('user-1', createQuery({ date: '2026-02-31' })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.schedule.findMany).not.toHaveBeenCalled();
    });
  });

  describe('createSchedule', () => {
    it('creates a schedule for the user with parsed start and end dates', async () => {
      const { prisma, service } = createService();
      const dto: CreateScheduleDto = {
        title: 'Product review',
        startsAt: '2026-05-28T09:00:00.000Z',
        endsAt: '2026-05-28T10:00:00.000Z',
        location: 'Conference Room',
        accent: ScheduleAccent.PURPLE,
      };
      const schedule = {
        id: 'schedule-1',
        title: dto.title,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        location: dto.location,
        accent: dto.accent,
      };

      prisma.schedule.create.mockResolvedValue(schedule);

      await expect(service.createSchedule('user-1', dto)).resolves.toEqual(
        schedule,
      );
      expect(prisma.schedule.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          title: dto.title,
          startsAt: new Date('2026-05-28T09:00:00.000Z'),
          endsAt: new Date('2026-05-28T10:00:00.000Z'),
          location: dto.location,
          accent: ScheduleAccent.PURPLE,
        },
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          location: true,
          accent: true,
        },
      });
    });

    it('rejects schedules where end time equals start time', async () => {
      const { prisma, service } = createService();
      const dto: CreateScheduleDto = {
        title: 'Product review',
        startsAt: '2026-05-28T09:00:00.000Z',
        endsAt: '2026-05-28T09:00:00.000Z',
        location: 'Conference Room',
        accent: ScheduleAccent.GREEN,
      };

      await expect(service.createSchedule('user-1', dto)).rejects.toThrow(
        'End time must be after start time',
      );
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });

    it('rejects schedules where end time is before start time', async () => {
      const { prisma, service } = createService();
      const dto: CreateScheduleDto = {
        title: 'Product review',
        startsAt: '2026-05-28T09:00:00.000Z',
        endsAt: '2026-05-28T08:59:59.000Z',
        location: 'Conference Room',
        accent: ScheduleAccent.GREEN,
      };

      await expect(service.createSchedule('user-1', dto)).rejects.toThrow(
        'End time must be after start time',
      );
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });
  });
});
