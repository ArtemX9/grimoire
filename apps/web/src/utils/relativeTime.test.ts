import { formatRelativeTime, isSyncStale } from './relativeTime';

const NOW = new Date('2026-11-04T12:00:00Z').getTime();
const ago = (ms: number) => new Date(NOW - ms);
const MIN = 60_000;
const DAY = 24 * 60 * MIN;

describe('formatRelativeTime', () => {
  it.each([
    [10_000, 'just now'],
    [5 * MIN, '5 min ago'],
    [3 * 60 * MIN, '3h ago'],
    [DAY + MIN, 'yesterday'],
    [4 * DAY, '4 days ago'],
    [65 * DAY, '2 months ago'],
    [400 * DAY, '1 year ago'],
  ])('formats %i ms ago as %s', (ms, expected) => {
    expect(formatRelativeTime(ago(ms), NOW)).toBe(expected);
  });
});

describe('isSyncStale', () => {
  it('treats a missing sync as stale', () => {
    expect(isSyncStale(null, NOW)).toBe(true);
  });

  it('is fresh within 7 days and stale after', () => {
    expect(isSyncStale(ago(6 * DAY), NOW)).toBe(false);
    expect(isSyncStale(ago(8 * DAY), NOW)).toBe(true);
  });
});
