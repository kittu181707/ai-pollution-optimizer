import type { CalendarEvent, JourneyInput, TransportMode } from './types';

export const modes: { value: TransportMode; label: string }[] = [
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'bus', label: 'Bus' },
  { value: 'metro', label: 'Metro' },
  { value: 'walk', label: 'Walk' },
];

export function uid(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
}

export function getUserId() {
  try {
    let id = localStorage.getItem('project_user_id');
    if (!id) {
      id = uid('user');
      localStorage.setItem('project_user_id', id);
    }
    return id;
  } catch {
    return uid('user');
  }
}

export function readStoredNumber(key: string, fallback: number) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function storeNumber(key: string, value: number) {
  try { localStorage.setItem(key, String(value)); } catch { /* storage is optional */ }
}

export function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function minutesToTime(minutes: number) {
  const safe = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

export function timeToMinutes(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

export function shortTime(value: string) {
  const time = value.includes('T') ? value.split('T')[1]?.slice(0, 5) : value.slice(0, 5);
  if (!time) return value;
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function deriveJourneys(events: CalendarEvent[], homeLocation: string): JourneyInput[] {
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
  if (!sorted.length) return [];

  const output: JourneyInput[] = [{
    tripId: uid('trip'),
    origin: homeLocation,
    destination: sorted[0].location,
    departureTime: minutesToTime(timeToMinutes(sorted[0].start) - 45),
    arriveBy: sorted[0].start,
    mode: 'car',
  }];

  for (let index = 1; index < sorted.length; index += 1) {
    output.push({
      tripId: uid('trip'),
      origin: sorted[index - 1].location,
      destination: sorted[index].location,
      departureTime: sorted[index - 1].end,
      arriveBy: sorted[index].start,
      mode: 'metro',
    });
  }

  if (sorted.at(-1)!.location.trim().toLowerCase() !== homeLocation.trim().toLowerCase()) {
    output.push({
      tripId: uid('trip'),
      origin: sorted.at(-1)!.location,
      destination: homeLocation,
      departureTime: sorted.at(-1)!.end,
      mode: 'car',
    });
  }
  return output;
}
