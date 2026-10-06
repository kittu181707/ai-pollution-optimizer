import type { CalendarEvent, DayAnalysis, RouteCandidate, TripCandidateSet } from '../types';

export interface OptimizeSetsInput {
  userId: string;
  date: string;
  events: CalendarEvent[];
  sets: TripCandidateSet[];
  maxExtraMinutes: number;
  environmentSource: string;
  routeSource: string;
}

type State = {
  pollution: number;
  secondaryEnvironment: number;
  inconvenience: number;
  selected: RouteCandidate[];
  combinations: bigint;
};

export function optimizeCandidateSets(input: OptimizeSetsInput): DayAnalysis {
  if (!input.sets.length) throw new Error('No journeys to optimize');

  const originals = input.sets.map((set) => set.original);
  const originalPollution = sum(originals, 'pollutionExposure');
  const originalModeled = sum(originals, 'modeledExposure');

  let states = new Map<number, State>();
  states.set(0, {
    pollution: 0,
    secondaryEnvironment: 0,
    inconvenience: 0,
    selected: [],
    combinations: 1n,
  });

  for (const set of input.sets) {
    if (!set.candidates.length) throw new Error(`No candidates for ${set.journey.origin} → ${set.journey.destination}`);
    const next = new Map<number, State>();

    for (const [extraSoFar, state] of states.entries()) {
      for (const candidate of set.candidates) {
        const candidateExtra = Math.max(0, candidate.travelMinutes - set.original.travelMinutes);
        const extra = extraSoFar + candidateExtra;
        if (extra > input.maxExtraMinutes) continue;

        const candidateChange = candidate.candidateId === set.original.candidateId ? 0 : 1;
        const proposed: State = {
          pollution: state.pollution + candidate.pollutionExposure,
          secondaryEnvironment: state.secondaryEnvironment + Math.max(0, candidate.modeledExposure - candidate.pollutionExposure),
          inconvenience: state.inconvenience + candidateExtra + Math.abs(candidate.shiftMinutes) * .1 + candidateChange * 2,
          selected: [...state.selected, candidate],
          combinations: state.combinations,
        };

        const existing = next.get(extra);
        const combinations = (existing?.combinations || 0n) + state.combinations;
        if (!existing || isBetter(proposed, existing)) {
          next.set(extra, { ...proposed, combinations });
        } else {
          next.set(extra, { ...existing, combinations });
        }
      }
    }

    if (!next.size) throw new Error('No feasible whole-day plan fits the extra-travel limit');
    states = next;
  }

  let best: State | undefined;
  for (const state of states.values()) {
    if (!best || isBetter(state, best)) best = state;
  }
  if (!best) throw new Error('No feasible plan');

  let selected = best.selected;
  let optimizedPollution = sum(selected, 'pollutionExposure');

  // Avoid disruptive recommendations for a negligible primary-metric gain.
  if (originalPollution > 0 && (originalPollution - optimizedPollution) / originalPollution < .01) {
    selected = originals;
    optimizedPollution = originalPollution;
  }

  const optimizedModeled = sum(selected, 'modeledExposure');
  const pollutionIndex = originalPollution > 0 ? Math.round((optimizedPollution / originalPollution) * 100) : 100;
  const pollutionReductionPct = Math.max(0, 100 - pollutionIndex);

  const trips = input.sets.map((set, index) => {
    const recommended = selected[index];
    const changed = recommended.candidateId !== set.original.candidateId;
    return {
      tripId: set.journey.tripId,
      origin: set.journey.origin,
      destination: set.journey.destination,
      original: set.original,
      recommended,
      candidatesEvaluated: set.candidates.length,
      changed,
      explanation: explain(set.original, recommended, set.journey.origin, set.journey.destination),
    };
  });

  const extraTravelMinutes = selected.reduce(
    (total, candidate, index) => total + Math.max(0, candidate.travelMinutes - originals[index].travelMinutes),
    0,
  );
  const feasibleCombinations = [...states.values()].reduce((total, state) => total + state.combinations, 0n);
  const totalCombinations = input.sets.reduce((total, set) => total * BigInt(set.candidates.length), 1n);

  return {
    userId: input.userId,
    planId: `plan-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    date: input.date,
    events: input.events,
    trips,
    changes: trips.filter((trip) => trip.changed),
    metrics: {
      originalExposureIndex: 100,
      optimizedExposureIndex: pollutionIndex,
      exposureReductionPct: pollutionReductionPct,
      originalRawExposure: round(originalModeled),
      optimizedRawExposure: round(optimizedModeled),
      originalPollutionExposure: round(originalPollution),
      optimizedPollutionExposure: round(optimizedPollution),
      pollutionReductionPct,
      extraTravelMinutes,
      appointmentsChanged: 0,
      originalHighUvMinutes: round(sum(originals, 'highUvOutdoorMinutes')),
      optimizedHighUvMinutes: round(sum(selected, 'highUvOutdoorMinutes')),
      originalHeatRiskMinutes: round(sum(originals, 'heatRiskOutdoorMinutes')),
      optimizedHeatRiskMinutes: round(sum(selected, 'heatRiskOutdoorMinutes')),
      estimatedCo2eChangeKg: round(sum(selected, 'estimatedCo2eKg') - sum(originals, 'estimatedCo2eKg'), 3),
    },
    workflow: {
      routesEvaluated: input.sets.reduce((total, set) => total + set.candidates.length, 0),
      dayPlansTested: safeBigInt(totalCombinations),
      feasiblePlans: safeBigInt(feasibleCombinations),
      environmentSource: input.environmentSource,
      routeSource: input.routeSource,
      environmentalSamples: selected.reduce((total, candidate) => total + candidate.environmentSamples.length, 0),
    },
  };
}

function isBetter(a: State, b: State) {
  if (Math.abs(a.pollution - b.pollution) > .01) return a.pollution < b.pollution;
  if (Math.abs(a.secondaryEnvironment - b.secondaryEnvironment) > .01) return a.secondaryEnvironment < b.secondaryEnvironment;
  return a.inconvenience < b.inconvenience;
}

function explain(original: RouteCandidate, recommended: RouteCandidate, origin: string, destination: string) {
  if (original.candidateId === recommended.candidateId) {
    return `No change needed for ${origin} to ${destination}; the current trip is the best feasible choice.`;
  }
  const pct = original.pollutionExposure > 0
    ? Math.max(0, Math.round((1 - recommended.pollutionExposure / original.pollutionExposure) * 100))
    : 0;
  const delta = recommended.travelMinutes - original.travelMinutes;
  const parts = [
    `${pct}% lower modeled pollution exposure`,
    `${delta >= 0 ? '+' : ''}${delta} travel min`,
  ];
  if (recommended.shiftMinutes) {
    parts.push(`${recommended.shiftMinutes > 0 ? '+' : ''}${recommended.shiftMinutes} min departure shift`);
  }
  return `${recommended.label}: ${parts.join(' · ')}.`;
}

function sum(items: RouteCandidate[], key: keyof RouteCandidate) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function safeBigInt(value: bigint) {
  return value > BigInt(Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : Number(value);
}

function round(value: number, digits = 1) {
  const power = 10 ** digits;
  return Math.round(value * power) / power;
}
