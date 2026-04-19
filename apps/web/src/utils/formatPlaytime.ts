export function formatPlaytime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const hourPart = `${h} ${h === 1 ? 'hour' : 'hours'}`;
    if (m === 0) return hourPart;
    return `${hourPart} ${m} ${m === 1 ? 'minute' : 'minutes'}`;
  }

  const d = Math.floor(hours / 24);
  const h = Math.floor(hours % 24);
  const dayPart = `${d} ${d === 1 ? 'day' : 'days'}`;
  if (h === 0) return dayPart;
  return `${dayPart} ${h} ${h === 1 ? 'hour' : 'hours'}`;
}
