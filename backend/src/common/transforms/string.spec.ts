import { describe, expect, it } from '@jest/globals';
import { emptyStringToUndefined, trimString } from './string';

describe('common transforms', () => {
  describe('trimString', () => {
    it('trims string values', () => {
      expect(trimString('  Dashdesk  ')).toBe('Dashdesk');
    });

    it('returns non-string values unchanged', () => {
      const value = { name: 'Dashdesk' };

      expect(trimString(42)).toBe(42);
      expect(trimString(null)).toBeNull();
      expect(trimString(value)).toBe(value);
    });
  });

  describe('emptyStringToUndefined', () => {
    it('trims non-empty strings', () => {
      expect(emptyStringToUndefined('  Ada  ')).toBe('Ada');
    });

    it('returns undefined for empty strings after trimming', () => {
      expect(emptyStringToUndefined('')).toBeUndefined();
      expect(emptyStringToUndefined('   ')).toBeUndefined();
    });

    it('returns undefined for non-string values', () => {
      expect(emptyStringToUndefined(42)).toBeUndefined();
      expect(emptyStringToUndefined(null)).toBeUndefined();
      expect(emptyStringToUndefined({ value: 'Dashdesk' })).toBeUndefined();
    });
  });
});
