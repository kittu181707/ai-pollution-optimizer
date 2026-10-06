import { strict as assert } from 'node:assert';
import { scoreRoute } from '../core/exposure';
import { optimizeCandidateSets } from '../core/optimizer';
import { snapshotFromTomorrowValues } from '../services/environment';
import type { EnvironmentSnapshot, RouteCandidate, TripCandidateSet } from '../types';

const env: EnvironmentSnapshot = {
  pm25: 100,
  pm10: 150,
  aqi: 160,
  temperature: 30,
  humidity: 50,
  windSpeed: 8,
  uvIndex: 3,
  rainProbability: 0,
  source: 'test',
};

function c(
  id: string,
  tripId: string,
  minutes: number,
  pollution: number,
  shift = 0,
  weatherPenalty = 0,
): RouteCandidate {
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
    modeledExposure: pollution + weatherPenalty,
    pollutionExposure: pollution,
    weatherPenalty,
    highUvOutdoorMinutes: weatherPenalty ? 8 : 0,
    heatRiskOutdoorMinutes: weatherPenalty ? 8 : 0,
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
assert.equal(loose.metrics.pollutionReductionPct, 55);
assert.equal(loose.metrics.appointmentsChanged, 0);
assert.equal(loose.userId, 'u1');

// Pollution is the primary objective: a lower-pollution option wins even if heat/UV is worse.
const hierarchySets: TripCandidateSet[] = [{
  journey: { tripId: 't3', origin: 'C', destination: 'D', departureTime: '12:00', mode: 'car' },
  original: c('o3', 't3', 20, 100, 0, 0),
  candidates: [c('o3', 't3', 20, 100, 0, 0), c('a3', 't3', 20, 80, 0, 400)],
}];
const hierarchy = optimizeCandidateSets({
  userId: 'u1',
  date: '2026-01-01',
  events: [],
  sets: hierarchySets,
  maxExtraMinutes: 0,
  environmentSource: 'test',
  routeSource: 'test',
});
assert.equal(hierarchy.trips[0].recommended.candidateId, 'a3');

// Tiny primary-metric gains are intentionally suppressed.
const tinyGain: TripCandidateSet[] = [{
  journey: { tripId: 't4', origin: 'D', destination: 'E', departureTime: '12:00', mode: 'car' },
  original: c('o4', 't4', 20, 100),
  candidates: [c('o4', 't4', 20, 100), c('a4', 't4', 20, 99.5)],
}];
const stable = optimizeCandidateSets({
  userId: 'u1',
  date: '2026-01-01',
  events: [],
  sets: tinyGain,
  maxExtraMinutes: 0,
  environmentSource: 'test',
  routeSource: 'test',
});
assert.equal(stable.changes.length, 0);

// Route exposure is the sum of segment samples, not one midpoint concentration.
const segmentEnvironment = (pm25: number): EnvironmentSnapshot => ({ ...env, pm25 });
const segmented = scoreRoute({
  candidateId: 'seg',
  routeId: 'seg',
  tripId: 'seg',
  mode: 'walk',
  label: 'Walk',
  travelMinutes: 20,
  distanceKm: 2,
  geometry: [{ lat: 0, lon: 0 }, { lat: 0, lon: 1 }],
  source: 'test',
  departureTime: '08:00',
  shiftMinutes: 0,
  environmentSamples: [
    { position: { lat: 0, lon: .25 }, minutes: 10, environment: segmentEnvironment(50) },
    { position: { lat: 0, lon: .75 }, minutes: 10, environment: segmentEnvironment(150) },
  ],
});
assert.equal(segmented.pollutionExposure, 2000);
assert.equal(segmented.environment.pm25, 100);


const tomorrow = snapshotFromTomorrowValues({
  particulateMatter25: 44,
  particulateMatter10: 71,
  epaIndex: 92,
  temperature: 29.5,
  humidity: 61,
  windSpeed: 8.4,
  uvIndex: 5.1,
  precipitationProbability: 35,
}, '2026-10-06T08:00:00Z', true);
assert.equal(tomorrow.pm25, 44);
assert.equal(tomorrow.pm10, 71);
assert.equal(tomorrow.aqi, 92);
assert.equal(tomorrow.temperature, 29.5);
assert.equal(tomorrow.rainProbability, 35);
assert(tomorrow.source.includes('Tomorrow.io realtime'));
assert.equal(tomorrow.validAt, '2026-10-06T08:00:00Z');

console.log('core optimizer, exposure and environmental mapping tests passed');
