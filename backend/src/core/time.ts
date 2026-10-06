const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function timeToMinutes(value: string): number {
  if (!isValidTime(value)) throw new Error(`Invalid time: ${value}`);
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function minutesToTime(minutes: number): string {
  if (!Number.isFinite(minutes)) throw new Error('Invalid minute value');
  const safe = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

export function shiftTime(value: string, delta: number): string {
  return minutesToTime(timeToMinutes(value) + delta);
}

export function availableMinutes(departure: string, arriveBy?: string): number {
  if (!arriveBy) return Number.POSITIVE_INFINITY;
  const start = timeToMinutes(departure);
  const end = timeToMinutes(arriveBy);
  return end - start;
}
