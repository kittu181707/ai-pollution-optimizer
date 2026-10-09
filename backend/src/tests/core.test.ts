import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { matchesSession, sessionUserId } from '../auth';
import { optimizeCandidateSets } from '../core/optimizer';
import { snapshotFromTomorrowValues } from '../services/environment';
import type { RouteCandidate, TripCandidateSet } from '../types';

const env = { pm25: 100, pm10: 150, aqi: 160, temperature: 30, humidity: 50, windSpeed: 8, uvIndex: 3, rainProbability: 0, source: 'test' };

function c(id: string, tripId: string, minutes: number, exposure: number, shift = 0): RouteCandidate {
  return {
    candidateId: id,
    routeId: id,
    tripId,
    mode: 'car',
    label: id,
    departureTime: '08:00',
    shiftMinutes: shift,
    travelMinutes: minutes,
    distanceKm: 10,
    modeledExposure: exposure,
    pollutionExposure: exposure,
    highUvOutdoorMinutes: 0,
    heatRiskOutdoorMinutes: 0,
    estimatedCo2eKg: 1,
    environment: env,
    environmentSamples: [{ position: { lat: 0, lon: 0 }, minutes, environment: env }],
    geometry: [],
    source: 'test',
  };
}

const sets: TripCandidateSet[] = [
  {
    journey: { tripId: 't1', origin: 'A', destination: 'B', departureTime: '08:00', mode: 'car' },
    original: c('o1', 't1', 20, 100),
    candidates: [c('o1', 't1', 20, 100), c('a1', 't1', 25, 50)],
  },
  {
    journey: { tripId: 't2', origin: 'B', destination: 'C', departureTime: '10:00', mode: 'car' },
    original: c('o2', 't2', 20, 100),
    candidates: [c('o2', 't2', 20, 100), c('a2', 't2', 25, 40)],
  },
];

const tight = optimizeCandidateSets({
  userId: 'u1',
  date: '2026-01-01',
  events: [],
  sets,
  maxExtraMinutes: 5,
  environmentSource: 'test',
  routeSource: 'test',
});
assert.equal(tight.metrics.extraTravelMinutes, 5);
assert.equal(tight.changes.length, 1);
assert.equal(tight.trips[1].recommended.candidateId, 'a2');

const loose = optimizeCandidateSets({
  userId: 'u1',
  date: '2026-01-01',
  events: [],
  sets,
  maxExtraMinutes: 10,
  environmentSource: 'test',
  routeSource: 'test',
});
assert.equal(loose.changes.length, 2);
assert.equal(loose.metrics.optimizedExposureIndex, 45);
assert.equal(loose.metrics.appointmentsChanged, 0);
assert.equal(loose.userId, 'u1');

const tinyGain: TripCandidateSet[] = [{
  journey: { tripId: 't3', origin: 'C', destination: 'D', departureTime: '12:00', mode: 'car' },
  original: c('o3', 't3', 20, 100),
  candidates: [c('o3', 't3', 20, 100), c('a3', 't3', 20, 99.5)],
}];
const stable = optimizeCandidateSets({
  userId: 'u1', date: '2026-01-01', events: [], sets: tinyGain, maxExtraMinutes: 0, environmentSource: 'test', routeSource: 'test',
});
assert.equal(stable.changes.length, 0);

const tomorrow = snapshotFromTomorrowValues({
  particulateMatter25: 44,
  particulateMatter10: 71,
  epaIndex: 92,
  temperature: 29.5,
  humidity: 61,
  windSpeed: 8.4,
  uvIndex: 5.1,
  precipitationProbability: 35,
}, '2026-10-07T08:00:00Z', true);
assert.equal(tomorrow.pm25, 44);
assert.equal(tomorrow.pm10, 71);
assert.equal(tomorrow.aqi, 92);
assert.equal(tomorrow.temperature, 29.5);
assert.equal(tomorrow.humidity, 61);
assert.equal(tomorrow.windSpeed, 8.4);
assert.equal(tomorrow.rainProbability, 35);
assert(tomorrow.source.includes('Tomorrow.io realtime'));

const token = 'ab'.repeat(32);
const userId = 'user-' + createHash('sha256').update(token).digest('hex').slice(0, 32);
const request = { headers: { authorization: 'Bearer ' + token } } as Pick<APIGatewayProxyEvent, 'headers'>;
assert.equal(sessionUserId(request), userId);
assert(matchesSession(request, userId));
assert(!matchesSession(request, 'user-' + '0'.repeat(32)));
assert.equal(sessionUserId({ headers: { authorization: 'Bearer invalid' } }), null);
assert.equal(sessionUserId({ headers: {} }), null);

console.log('core optimizer, session verification and environmental mapping tests passed');
