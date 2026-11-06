const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const SYNC_STALE_AFTER_MS = 7 * DAY;

export function formatRelativeTime(date: Date | string, now: number = Date.now()): string {
  const diff = now - new Date(date).getTime();

  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;

  const days = Math.floor(diff / DAY);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

export function isSyncStale(lastSyncAt: Date | string | null | undefined, now: number = Date.now()): boolean {
  if (!lastSyncAt) return true;
  return now - new Date(lastSyncAt).getTime() > SYNC_STALE_AFTER_MS;
}
