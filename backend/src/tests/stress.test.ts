import { strict as assert } from 'node:assert';
import { handler as prepare } from '../handlers/prepare';
import { parseIcs } from '../core/ics';
import { isValidTime, timeToMinutes, availableMinutes } from '../core/time';
import { optimizeCandidateSets } from '../core/optimizer';
import { demoDay } from '../core/demo';
import { ALT_MODE_ORDER, TIME_SHIFT_OPTIONS, runDirectAnalysis } from '../services/analyze';
import { routesForTrip } from '../services/routes';
import type { EnvironmentSnapshot, RouteCandidate, TripCandidateSet } from '../types';

const env: EnvironmentSnapshot = {
  pm25: 90,
  pm10: 130,
  aqi: 120,
  temperature: 33,
  humidity: 45,
  windSpeed: 7,
  uvIndex: 7,
  rainProbability: 10,
  source: 'stress',
};

function candidate(trip: number, option: number): RouteCandidate {
  const original = option === 0;
  return {
    candidateId: `t${trip}-o${option}`,
    routeId: `r${trip}-o${option}`,
    tripId: `t${trip}`,
    mode: option % 2 ? 'metro' : 'car',
    label: `Option ${option}`,
    departureTime: '08:00',
    shiftMinutes: option === 4 ? 10 : 0,
    travelMinutes: 20 + option,
    distanceKm: 8 + option,
    modeledExposure: 100 - option * 8 - trip * .1,
    pollutionExposure: 90 - option * 6,
    weatherPenalty: 10,
    highUvOutdoorMinutes: option % 2 ? 3 : 1,
    heatRiskOutdoorMinutes: option % 2 ? 3 : 1,
    estimatedCo2eKg: original ? 1.2 : .5,
    environment: env,
    environmentSamples: [{ position: { lat: 0, lon: 0 }, minutes: 20 + option, environment: env }],
    geometry: [],
    source: 'stress',
  };
}

async function main() {
  const manySets: TripCandidateSet[] = Array.from({ length: 30 }, (_, trip) => ({
    journey: { tripId: `t${trip}`, origin: `O${trip}`, destination: `D${trip}`, departureTime: '08:00', mode: 'car' },
    original: candidate(trip, 0),
    candidates: Array.from({ length: 5 }, (_, option) => candidate(trip, option)),
  }));

  const started = Date.now();
  const stress = optimizeCandidateSets({
    userId: 'stress-user',
    date: '2026-10-06',
    events: [],
    sets: manySets,
    maxExtraMinutes: 30,
    environmentSource: 'stress',
    routeSource: 'stress',
  });
  assert(Date.now() - started < 2000, 'optimizer should remain bounded with many candidate combinations');
  assert(stress.metrics.extraTravelMinutes <= 30);
  assert(stress.trips.every((trip) => trip.recommended));
  assert.equal(stress.workflow.dayPlansTested, Number.MAX_SAFE_INTEGER);

  assert.deepEqual(TIME_SHIFT_OPTIONS, [-10, -5, 0, 5, 10]);
  assert.deepEqual(ALT_MODE_ORDER, ['metro', 'bus', 'car', 'bike', 'walk']);

  assert.equal(isValidTime('23:59'), true);
  assert.equal(isValidTime('24:00'), false);
  assert.throws(() => timeToMinutes('9:00'));

  const ics = parseIcs([
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'UID:all-day',
    'DTSTART;VALUE=DATE:20261006',
    'SUMMARY:Holiday',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:timed',
    'DTSTART:20261006T090000',
    'DTEND:20261006T100000',
    'SUMMARY:Meeting',
    'LOCATION:Office',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n'));
  if (ics.date === '2026-10-06') {
    assert.equal(ics.events.length, 1);
    assert.equal(ics.events[0].title, 'Meeting');
  }

  await assert.rejects(
    () => prepare({
      userId: 'u1',
      date: '2026-10-06',
      homeLocation: 'Home',
      maxExtraMinutes: 10,
      events: [
        { eventId: '1', title: 'A', location: 'X', start: '09:00', end: '10:00', fixed: true },
        { eventId: '2', title: 'B', location: 'Y', start: '09:30', end: '11:00', fixed: true },
      ],
      journeys: [{ tripId: 't1', origin: 'Home', destination: 'X', departureTime: '08:00', arriveBy: '09:00', mode: 'car' }],
    }),
    /overlaps/,
  );

  await assert.rejects(
    () => prepare({
      userId: 'u1',
      date: '2026-10-06',
      homeLocation: 'Home',
      maxExtraMinutes: 10,
      events: [{ eventId: '1', title: 'A', location: 'X', start: '09:00', end: '10:00', fixed: true }],
      journeys: [{ tripId: 't1', origin: 'Home', destination: 'Wrong', departureTime: '08:00', arriveBy: '09:00', mode: 'car' }],
    }),
    /does not match/,
  );

  await assert.rejects(
    () => routesForTrip({
      origin: { lat: 28.6, lon: 77.2 },
      destination: { lat: 28.7, lon: 77.3 },
      mode: 'bike',
      date: '2026-10-06',
      departureTime: '08:00',
      demoMode: false,
      tripOrdinal: 0,
    }),
    /Bike routing is unavailable/,
  );

  const day = demoDay();
  const demoRequest = {
    ...day,
    userId: 'e2e-user',
    maxExtraMinutes: 10,
    demoMode: true,
    journeys: [
      { tripId: 'd1', origin: 'Home, Delhi', destination: 'Delhi Technological University', departureTime: '07:45', arriveBy: '08:30', mode: 'car' as const },
      { tripId: 'd2', origin: 'Delhi Technological University', destination: 'Connaught Place', departureTime: '12:15', arriveBy: '13:00', mode: 'metro' as const },
      { tripId: 'd3', origin: 'Connaught Place', destination: 'Gym, Delhi', departureTime: '17:45', arriveBy: '18:30', mode: 'metro' as const },
      { tripId: 'd4', origin: 'Gym, Delhi', destination: 'Home, Delhi', departureTime: '19:20', arriveBy: '20:00', mode: 'bike' as const },
    ],
  };

  const preparedDemo = await prepare(demoRequest);
  const endToEnd = await runDirectAnalysis(preparedDemo);
  assert.equal(endToEnd.trips.length, 4);
  assert.equal(endToEnd.metrics.appointmentsChanged, 0);
  assert.equal(endToEnd.metrics.extraTravelMinutes, 7);
  assert(endToEnd.metrics.pollutionReductionPct >= 30 && endToEnd.metrics.pollutionReductionPct <= 40);
  const uvReduction = endToEnd.metrics.originalHighUvMinutes > 0
    ? Math.round((1 - endToEnd.metrics.optimizedHighUvMinutes / endToEnd.metrics.originalHighUvMinutes) * 100)
    : 0;
  assert(uvReduction >= 25 && uvReduction <= 35);
  assert.deepEqual(endToEnd.changes.map((trip) => trip.tripId), ['d2', 'd3']);

  const reductions = endToEnd.changes.map((trip) => ({
    tripId: trip.tripId,
    reduction: trip.original.pollutionExposure - trip.recommended.pollutionExposure,
  })).sort((a, b) => b.reduction - a.reduction);
  assert.equal(reductions[0]?.tripId, 'd3');
  assert(reductions[0].reduction > reductions[1].reduction * 20);

  assert(endToEnd.workflow.routeSource.includes('Controlled demo route data'));
  assert(endToEnd.workflow.environmentSource.includes('Controlled demo environmental data'));
  assert(endToEnd.workflow.environmentalSamples >= 12);

  endToEnd.trips.forEach((trip, index) => {
    const arriveBy = demoRequest.journeys[index].arriveBy;
    assert(trip.recommended.travelMinutes <= availableMinutes(trip.recommended.departureTime, arriveBy));
    assert(trip.candidatesEvaluated > 0);
    assert(trip.recommended.environmentSamples.length === 3);
    assert(Number.isFinite(trip.recommended.environment.humidity));
    assert(Number.isFinite(trip.recommended.environment.windSpeed));
  });

  console.log('demo metrics', JSON.stringify(endToEnd.metrics));
  console.log('stress, feasibility, candidate-generation and demo tests passed');
}

void main();
