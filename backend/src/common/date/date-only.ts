import { BadRequestException } from '@nestjs/common';

export const DATE_ONLY_PATTERN =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseDateOnly(value: unknown): Date {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
    throw new BadRequestException('Date must use the YYYY-MM-DD format');
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || formatDateOnly(date) !== value) {
    throw new BadRequestException('Date must be a valid calendar date');
  }

  return date;
}

export function getUtcDayRange(value: unknown): {
  startsAt: Date;
  endsBefore: Date;
} {
  const startsAt = parseDateOnly(value);

  return {
    startsAt,
    endsBefore: new Date(startsAt.getTime() + DAY_IN_MS),
  };
}

export function getUtcCalendarMonthRange(value: unknown): {
  startsAt: Date;
  endsAt: Date;
} {
  const date = parseDateOnly(value);
  const startsAt = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
  );
  const nextMonthStartsAt = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  );

  return {
    startsAt,
    endsAt: new Date(nextMonthStartsAt.getTime() - DAY_IN_MS),
  };
}
