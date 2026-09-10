import { describe, it, expect } from 'vitest';
import { resolveEffectiveBuffer, getOperationalPeriod, BufferInput } from './buffer.util';

describe('buffer.util', () => {
  describe('resolveEffectiveBuffer', () => {
    it('uses business defaults when item and category are null', () => {
      const input: BufferInput = {
        itemBefore: null,
        itemAfter: null,
        categoryBefore: null,
        categoryAfter: null,
        businessBefore: 120,
        businessAfter: 720,
      };
      
      const result = resolveEffectiveBuffer(input);
      expect(result).toEqual({ before: 120, after: 720 });
    });

    it('prefers category overrides over business defaults', () => {
      const input: BufferInput = {
        itemBefore: null,
        itemAfter: null,
        categoryBefore: 240,
        categoryAfter: 1440,
        businessBefore: 120,
        businessAfter: 720,
      };
      
      const result = resolveEffectiveBuffer(input);
      expect(result).toEqual({ before: 240, after: 1440 });
    });

    it('prefers item overrides over category and business defaults', () => {
      const input: BufferInput = {
        itemBefore: 360,
        itemAfter: 2880,
        categoryBefore: 240,
        categoryAfter: 1440,
        businessBefore: 120,
        businessAfter: 720,
      };
      
      const result = resolveEffectiveBuffer(input);
      expect(result).toEqual({ before: 360, after: 2880 });
    });

    it('resolves before and after independently', () => {
      const input: BufferInput = {
        itemBefore: null,
        itemAfter: 360,
        categoryBefore: 240,
        categoryAfter: null,
        businessBefore: 120,
        businessAfter: 720,
      };
      
      const result = resolveEffectiveBuffer(input);
      expect(result).toEqual({ before: 240, after: 360 });
    });
  });

  describe('getOperationalPeriod', () => {
    it('calculates operational period correctly based on buffer minutes', () => {
      const eventStart = new Date('2023-11-12T18:00:00Z');
      const eventEnd = new Date('2023-11-12T23:00:00Z');
      
      // 2h before, 12h after
      const before = 120;
      const after = 720;
      
      const period = getOperationalPeriod(eventStart, eventEnd, before, after);
      
      // 18:00 - 2h = 16:00
      expect(period.effectiveStart.toISOString()).toBe('2023-11-12T16:00:00.000Z');
      
      // 23:00 + 12h = next day 11:00
      expect(period.effectiveEnd.toISOString()).toBe('2023-11-13T11:00:00.000Z');
    });
  });
});
