import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from '@jest/globals';
import {
  formatDateOnly,
  getUtcCalendarMonthRange,
  getUtcDayRange,
  parseDateOnly,
} from './date-only';

describe('date-only helpers', () => {
  describe('formatDateOnly', () => {
    it('formats a Date as YYYY-MM-DD in UTC', () => {
      expect(formatDateOnly(new Date('2026-05-28T19:30:00.000Z'))).toBe(
        '2026-05-28',
      );
    });
  });

  describe('parseDateOnly', () => {
    it('parses a valid date-only string at UTC midnight', () => {
      expect(parseDateOnly('2026-05-28')).toEqual(
        new Date('2026-05-28T00:00:00.000Z'),
      );
    });

    it('rejects non date-only values', () => {
      expect(() => parseDateOnly('2026-5-28')).toThrow(BadRequestException);
      expect(() => parseDateOnly('2026-05-28T00:00:00.000Z')).toThrow(
        BadRequestException,
      );
      expect(() => parseDateOnly(null)).toThrow(BadRequestException);
    });

    it('rejects invalid calendar dates', () => {
      expect(() => parseDateOnly('2026-02-31')).toThrow(BadRequestException);
      expect(() => parseDateOnly('2025-02-29')).toThrow(BadRequestException);
    });
  });

  describe('getUtcDayRange', () => {
    it('returns UTC day bounds with an exclusive end', () => {
      expect(getUtcDayRange('2026-05-28')).toEqual({
        startsAt: new Date('2026-05-28T00:00:00.000Z'),
        endsBefore: new Date('2026-05-29T00:00:00.000Z'),
      });
    });
  });

  describe('getUtcCalendarMonthRange', () => {
    it('returns first and last date-only bounds for a calendar month', () => {
      expect(getUtcCalendarMonthRange('2024-02-29')).toEqual({
        startsAt: new Date('2024-02-01T00:00:00.000Z'),
        endsAt: new Date('2024-02-29T00:00:00.000Z'),
      });
    });
  });
});
