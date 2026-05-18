import { Injectable } from '@nestjs/common';
import {
  GetSchedulesQueryDto,
  ScheduleAccent,
  ScheduleItemDto,
  SchedulesListDto,
} from './schedules.dto';

const DEFAULT_SCHEDULE_DATE = '2021-06-05';

const generatedScheduleSources = [
  {
    id: 'meeting-with-suppliers',
    title: 'Meeting with suppliers',
    location: 'at Sunset Road, Kuta, Bali',
    accent: ScheduleAccent.GREEN,
  },
  {
    id: 'giga-factory-check',
    title: 'Check operation at Giga Factory',
    location: 'at Central Jakarta',
    accent: ScheduleAccent.PURPLE,
  },
  {
    id: 'inventory-sync',
    title: 'Inventory sync review',
    location: 'at Main Warehouse',
    accent: ScheduleAccent.GREEN,
  },
  {
    id: 'regional-briefing',
    title: 'Regional team briefing',
    location: 'at South Jakarta',
    accent: ScheduleAccent.PURPLE,
  },
] as const;

const generatedTimeSlots = [
  { startHour: 9, durationHours: 1 },
  { startHour: 11, durationHours: 1 },
  { startHour: 14, durationHours: 1 },
  { startHour: 16, durationHours: 2 },
  { startHour: 18, durationHours: 2 },
] as const;

function dateSeed(date: string): number {
  return [...date].reduce((seed, character) => {
    return seed + character.charCodeAt(0);
  }, 0);
}

function toIsoDateTime(date: string, hour: number): string {
  return `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`;
}

function toTimeLabel(startHour: number, durationHours: number): string {
  const endHour = startHour + durationHours;

  return `${String(startHour).padStart(2, '0')}.00-${String(endHour).padStart(2, '0')}.00`;
}

function generateSchedulesForDate(date: string): ScheduleItemDto[] {
  const seed = dateSeed(date);

  return Array.from({ length: 2 }, (_, index) => {
    const source =
      generatedScheduleSources[
        (seed + index) % generatedScheduleSources.length
      ];
    const timeSlot =
      generatedTimeSlots[(seed + index * 2) % generatedTimeSlots.length];

    return {
      id: `${date}-${source.id}`,
      title: source.title,
      date,
      startsAt: toIsoDateTime(date, timeSlot.startHour),
      endsAt: toIsoDateTime(date, timeSlot.startHour + timeSlot.durationHours),
      time: toTimeLabel(timeSlot.startHour, timeSlot.durationHours),
      location: source.location,
      accent: source.accent,
    };
  });
}

@Injectable()
export class SchedulesService {
  getSchedules(query: GetSchedulesQueryDto): SchedulesListDto {
    const items = generateSchedulesForDate(query.date ?? DEFAULT_SCHEDULE_DATE);

    return {
      items,
    };
  }
}
