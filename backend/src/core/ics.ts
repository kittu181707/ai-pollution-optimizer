import type { CalendarEvent } from '../types';
import { minutesToTime, timeToMinutes } from './time';

type ParsedDateTime = { date: string; time: string; allDay: boolean };

function unfold(text: string) {
  return text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
}

function splitProperty(line: string) {
  const index = line.indexOf(':');
  const left = index >= 0 ? line.slice(0, index) : line;
  const rawValue = index >= 0 ? line.slice(index + 1).trim() : '';
  const [name, ...parameters] = left.split(';');
  return { name: name.toUpperCase(), parameters: parameters.map((p) => p.toUpperCase()), rawValue };
}

function decode(text: string) {
  return text.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

function offsetMinutes() {
  const raw = process.env.APP_TIMEZONE_OFFSET || '+05:30';
  if (raw === 'Z') return 0;
  const match = raw.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return 330;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -minutes : minutes;
}

function localToday() {
  return new Date(Date.now() + offsetMinutes() * 60_000).toISOString().slice(0, 10);
}

function parseDateTime(raw: string, parameters: string[]): ParsedDateTime {
  if (parameters.some((p) => p === 'VALUE=DATE') || /^\d{8}$/.test(raw)) {
    const match = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!match) throw new Error('Invalid all-day calendar value');
    return { date: `${match[1]}-${match[2]}-${match[3]}`, time: '00:00', allDay: true };
  }

  const match = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(?:\d{2})?(Z)?$/);
  if (!match) throw new Error(`Unsupported calendar date-time: ${raw}`);
  const [, year, month, day, hour, minute, utc] = match;

  if (!utc) return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}`, allDay: false };

  const millis = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  const local = new Date(millis + offsetMinutes() * 60_000);
  return { date: local.toISOString().slice(0, 10), time: local.toISOString().slice(11, 16), allDay: false };
}

function plusMinutes(time: string, minutes: number) {
  return minutesToTime(timeToMinutes(time) + minutes);
}

export function parseIcs(icsText: string) {
  if (icsText.length > 512_000) throw new Error('Calendar file is too large');

  const lines = unfold(icsText);
  const parsed: Array<{ date: string; event: CalendarEvent }> = [];
  let current: Record<string, { rawValue: string; parameters: string[] }> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { current = {}; continue; }
    if (line === 'END:VEVENT' && current) {
      const startProp = current.DTSTART;
      const summary = current.SUMMARY?.rawValue;
      if (startProp && summary) {
        const start = parseDateTime(startProp.rawValue, startProp.parameters);
        if (!start.allDay) {
          const endProp = current.DTEND;
          const end = endProp ? parseDateTime(endProp.rawValue, endProp.parameters) : { ...start, time: plusMinutes(start.time, 60) };
          if (end.date !== start.date) throw new Error('Overnight calendar events are not supported');
          const endTime = timeToMinutes(end.time) > timeToMinutes(start.time) ? end.time : plusMinutes(start.time, 60);
          parsed.push({
            date: start.date,
            event: {
              eventId: `${decode(current.UID?.rawValue || 'event')}-${parsed.length + 1}`,
              title: decode(summary),
              location: decode(current.LOCATION?.rawValue || ''),
              start: start.time,
              end: endTime,
              fixed: true,
            },
          });
        }
      }
      current = null;
      continue;
    }

    if (!current) continue;
    const property = splitProperty(line);
    if (['UID', 'SUMMARY', 'LOCATION', 'DTSTART', 'DTEND'].includes(property.name)) {
      current[property.name] = { rawValue: property.rawValue, parameters: property.parameters };
    }
  }

  const targetDate = localToday();
  const events = parsed
    .filter((item) => item.date === targetDate)
    .map((item) => item.event)
    .sort((a, b) => a.start.localeCompare(b.start));

  if (events.length > 6) throw new Error(`Calendar has ${events.length} timed events today; maximum supported is 6`);
  return { date: targetDate, homeLocation: 'Home', events };
}
