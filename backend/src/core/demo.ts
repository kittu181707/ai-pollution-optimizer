import type { AgendaPayload } from './demo.types';

export const DEMO_COORDS: Record<string, { lat: number; lon: number }> = {
  'Home, Delhi': { lat: 28.6133, lon: 77.2090 },
  'Delhi Technological University': { lat: 28.7501, lon: 77.1177 },
  'Connaught Place': { lat: 28.6315, lon: 77.2167 },
  'Gym, Delhi': { lat: 28.6208, lon: 77.2295 },
};

function localDate() {
  const raw = process.env.APP_TIMEZONE_OFFSET || '+05:30';
  const match = raw === 'Z' ? null : raw.match(/^([+-])(\d{2}):(\d{2})$/);
  const offset = raw === 'Z' ? 0 : match
    ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]))
    : 330;
  return new Date(Date.now() + offset * 60_000).toISOString().slice(0, 10);
}

export function demoDay(): AgendaPayload {
  return {
    date: localDate(),
    homeLocation: 'Home, Delhi',
    events: [
      { eventId: 'demo-e1', title: 'College', location: 'Delhi Technological University', start: '08:30', end: '12:00', fixed: true },
      { eventId: 'demo-e2', title: 'Connaught Place', location: 'Connaught Place', start: '13:00', end: '17:30', fixed: true },
      { eventId: 'demo-e3', title: 'Gym', location: 'Gym, Delhi', start: '18:30', end: '19:10', fixed: true },
      { eventId: 'demo-e4', title: 'Home block', location: 'Home, Delhi', start: '20:00', end: '20:30', fixed: true },
    ],
  };
}
