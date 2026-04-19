import { describe, expect, it } from 'vitest';

import { formatPlaytime } from './formatPlaytime';

describe('formatPlaytime', () => {
  it('returns "0 minutes" for 0 hours', () => {
    expect(formatPlaytime(0)).toBe('0 minutes');
  });

  it('returns minutes for sub-hour values', () => {
    expect(formatPlaytime(0.75)).toBe('45 minutes');
  });

  it('returns "1 hour" for exactly 1 hour', () => {
    expect(formatPlaytime(1)).toBe('1 hour');
  });

  it('returns hours and minutes for fractional hours', () => {
    expect(formatPlaytime(1.5)).toBe('1 hour 30 minutes');
  });

  it('returns plural hours and drops minutes when minutes are 0', () => {
    expect(formatPlaytime(2)).toBe('2 hours');
  });

  it('returns hours and minutes for 2.5 hours', () => {
    expect(formatPlaytime(2.5)).toBe('2 hours 30 minutes');
  });

  it('returns "1 day" for exactly 24 hours', () => {
    expect(formatPlaytime(24)).toBe('1 day');
  });

  it('returns days and hours for 25.5 hours', () => {
    expect(formatPlaytime(25.5)).toBe('1 day 1 hour');
  });

  it('returns "2 days" for 48 hours', () => {
    expect(formatPlaytime(48)).toBe('2 days');
  });

  it('returns days and hours for 49.5 hours', () => {
    expect(formatPlaytime(49.5)).toBe('2 days 1 hour');
  });
});
