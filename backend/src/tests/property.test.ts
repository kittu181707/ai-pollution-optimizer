import { strict as assert } from 'node:assert';
import { optimizeCandidateSets } from '../core/optimizer';
import type { EnvironmentSnapshot, RouteCandidate, TripCandidateSet } from '../types';

const environment: EnvironmentSnapshot = {
  pm25: 50,
  pm10: 80,
  aqi: 90,
  temperature: 29,
  humidity: 55,
  windSpeed: 8,
  uvIndex: 3,
  rainProbability: 10,
  source: 'property-test',
};

let seed = 0x5eed1234;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}
function integer(min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function candidate(trip: number, option: number, originalMinutes: number): RouteCandidate {
  const travelMinutes = option === 0 ? originalMinutes : Math.max(4, originalMinutes + integer(-4, 8));
  const pollution = option === 0 ? integer(70, 150) : integer(25, 170);
  const weatherPenalty = integer(0, 80);
  const shift = option === 0 ? 0 : [-10, -5, 0, 5, 10][integer(0, 4)];
  return {
    candidateId: 't' + trip + '-o' + option,
    routeId: 'r' + trip + '-o' + option,
    tripId: 't' + trip,
    mode: option % 2 ? 'metro' : 'car',
    label: 'Option ' + option,
    departureTime: '08:00',
    shiftMinutes: shift,
    travelMinutes,
    distanceKm: 5 + option,
    modeledExposure: pollution + weatherPenalty,
    pollutionExposure: pollution,
    weatherPenalty,
    highUvOutdoorMinutes: weatherPenalty / 10,
    heatRiskOutdoorMinutes: weatherPenalty / 12,
    estimatedCo2eKg: option % 2 ? .4 : 1,
    environment,
    environmentSamples: [{ position: { lat: 0, lon: 0 }, minutes: travelMinutes, environment }],
    geometry: [],
    source: 'property-test',
  };
}

type Choice = { selected: RouteCandidate[]; pollution: number; secondary: number; inconvenience: number; extra: number };

function scoreChoice(selected: RouteCandidate[], sets: TripCandidateSet[]): Choice {
  let pollution = 0;
  let secondary = 0;
  let inconvenience = 0;
  let extra = 0;
  selected.forEach((item, index) => {
    const original = sets[index].original;
    const itemExtra = Math.max(0, item.travelMinutes - original.travelMinutes);
    pollution += item.pollutionExposure;
    secondary += Math.max(0, item.modeledExposure - item.pollutionExposure);
    extra += itemExtra;
    inconvenience += itemExtra + Math.abs(item.shiftMinutes) * .1 + (item.candidateId === original.candidateId ? 0 : 2);
  });
  return { selected, pollution, secondary, inconvenience, extra };
}

function better(a: Choice, b: Choice) {
  if (Math.abs(a.pollution - b.pollution) > .01) return a.pollution < b.pollution;
  if (Math.abs(a.secondary - b.secondary) > .01) return a.secondary < b.secondary;
  return a.inconvenience < b.inconvenience;
}

function bruteForce(sets: TripCandidateSet[], maxExtra: number) {
  let best: Choice | undefined;
  const selected: RouteCandidate[] = [];

  const visit = (index: number) => {
    if (index === sets.length) {
      const scored = scoreChoice([...selected], sets);
      if (scored.extra <= maxExtra && (!best || better(scored, best))) best = scored;
      return;
    }
    for (const item of sets[index].candidates) {
      selected.push(item);
      visit(index + 1);
      selected.pop();
    }
  };
  visit(0);
  if (!best) throw new Error('No brute-force plan');

  const originals = sets.map((set) => set.original);
  const original = scoreChoice(originals, sets);
  if (original.pollution > 0 && (original.pollution - best.pollution) / original.pollution < .01) return original;
  return best;
}

for (let run = 0; run < 250; run += 1) {
  const tripCount = integer(1, 4);
  const optionCount = integer(2, 4);
  const sets: TripCandidateSet[] = Array.from({ length: tripCount }, (_, trip) => {
    const originalMinutes = integer(8, 35);
    const candidates = Array.from({ length: optionCount }, (_, option) => candidate(trip, option, originalMinutes));
    return {
      journey: { tripId: 't' + trip, origin: 'O' + trip, destination: 'D' + trip, departureTime: '08:00', mode: 'car' as const },
      original: candidates[0],
      candidates,
    };
  });
  const maxExtra = integer(0, 20);
  const expected = bruteForce(sets, maxExtra);
  const actual = optimizeCandidateSets({
    userId: 'property-user',
    date: '2026-10-06',
    events: [],
    sets,
    maxExtraMinutes: maxExtra,
    environmentSource: 'property',
    routeSource: 'property',
  });

  assert(Math.abs(actual.metrics.optimizedPollutionExposure - expected.pollution) <= .11, 'DP pollution differs from brute force');
  assert.equal(actual.metrics.extraTravelMinutes, expected.extra, 'DP extra travel differs from brute force');
  assert(actual.metrics.extraTravelMinutes <= maxExtra, 'DP exceeded whole-day extra-time budget');
  assert(actual.metrics.optimizedPollutionExposure <= actual.metrics.originalPollutionExposure + .11, 'optimizer made primary metric worse');
  assert.equal(actual.metrics.appointmentsChanged, 0);
}

// Much larger than product limits: bounded-state DP should remain fast and feasible.
const largeSets: TripCandidateSet[] = Array.from({ length: 60 }, (_, trip) => {
  const originalMinutes = 20;
  const candidates = Array.from({ length: 12 }, (_, option) => candidate(trip, option, originalMinutes));
  candidates[0] = { ...candidates[0], travelMinutes: originalMinutes, pollutionExposure: 120, modeledExposure: 130, shiftMinutes: 0 };
  return {
    journey: { tripId: 'large-' + trip, origin: 'O', destination: 'D', departureTime: '08:00', mode: 'car' as const },
    original: candidates[0],
    candidates,
  };
});
const started = Date.now();
const large = optimizeCandidateSets({
  userId: 'large-property-user',
  date: '2026-10-06',
  events: [],
  sets: largeSets,
  maxExtraMinutes: 120,
  environmentSource: 'property',
  routeSource: 'property',
});
assert(Date.now() - started < 2500, 'large DP stress exceeded 2.5 seconds');
assert(large.metrics.extraTravelMinutes <= 120);
assert.equal(large.trips.length, 60);

console.log('250 brute-force equivalence cases + 60x12 bounded DP stress passed');
