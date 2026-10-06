import type { EnvironmentSnapshot, RouteCandidate, RouteEnvironmentSample, TransportMode } from '../types';

const EXPOSURE_FACTOR: Record<TransportMode, number> = { car: .62, bike: 1.2, bus: .78, metro: .48, walk: 1 };
const CO2_KG_PER_KM: Record<TransportMode, number> = { car: .171, bike: 0, bus: .082, metro: .035, walk: 0 };

export function outdoorMinutes(mode: TransportMode, travelMinutes: number) {
  if (mode === 'walk' || mode === 'bike') return travelMinutes;
  if (mode === 'metro') return Math.min(12, Math.max(4, travelMinutes * .24));
  if (mode === 'bus') return Math.min(10, Math.max(3, travelMinutes * .16));
  return 0;
}

export function scoreRoute(input: {
  candidateId: string;
  routeId: string;
  tripId: string;
  mode: TransportMode;
  label: string;
  travelMinutes: number;
  distanceKm: number;
  geometry: { lat: number; lon: number }[];
  source: string;
  departureTime: string;
  shiftMinutes: number;
  environmentSamples: RouteEnvironmentSample[];
}): RouteCandidate {
  if (!input.environmentSamples.length) throw new Error('Route has no environmental samples');

  const totalSampleMinutes = input.environmentSamples.reduce((sum, sample) => sum + sample.minutes, 0);
  if (!(totalSampleMinutes > 0)) throw new Error('Route environmental samples have no duration');

  const outside = outdoorMinutes(input.mode, input.travelMinutes);
  const outdoorRatio = input.travelMinutes > 0 ? Math.min(1, outside / input.travelMinutes) : 0;

  let pollutionExposure = 0;
  let highUvOutdoorMinutes = 0;
  let heatRiskOutdoorMinutes = 0;
  let heatPenalty = 0;
  let uvPenalty = 0;
  let rainPenalty = 0;

  for (const sample of input.environmentSamples) {
    const minutes = sample.minutes;
    const environment = sample.environment;
    const outdoorSegmentMinutes = minutes * outdoorRatio;

    pollutionExposure += environment.pm25 * minutes * EXPOSURE_FACTOR[input.mode];

    if (environment.uvIndex >= 6) {
      highUvOutdoorMinutes += outdoorSegmentMinutes;
      uvPenalty += outdoorSegmentMinutes * Math.max(0, environment.uvIndex - 5) * 2.6;
    }
    if (environment.temperature >= 32) {
      heatRiskOutdoorMinutes += outdoorSegmentMinutes;
      heatPenalty += outdoorSegmentMinutes * Math.max(0, environment.temperature - 31) * 2.2;
    }
    if (environment.rainProbability >= 60 && (input.mode === 'walk' || input.mode === 'bike')) {
      rainPenalty += outdoorSegmentMinutes * 1.8;
    }
  }

  const weatherPenalty = heatPenalty + uvPenalty + rainPenalty;
  const environment = weightedEnvironment(input.environmentSamples);

  return {
    ...input,
    modeledExposure: round(pollutionExposure + weatherPenalty),
    pollutionExposure: round(pollutionExposure),
    weatherPenalty: round(weatherPenalty),
    highUvOutdoorMinutes: round(highUvOutdoorMinutes),
    heatRiskOutdoorMinutes: round(heatRiskOutdoorMinutes),
    estimatedCo2eKg: round(input.distanceKm * CO2_KG_PER_KM[input.mode], 3),
    environment,
  };
}

function weightedEnvironment(samples: RouteEnvironmentSample[]): EnvironmentSnapshot {
  const total = samples.reduce((sum, sample) => sum + sample.minutes, 0);
  const weighted = (key: keyof Omit<EnvironmentSnapshot, 'source'>) =>
    samples.reduce((sum, sample) => sum + Number(sample.environment[key]) * sample.minutes, 0) / total;
  const sources = [...new Set(samples.map((sample) => sample.environment.source))];

  return {
    pm25: round(weighted('pm25'), 1),
    pm10: round(weighted('pm10'), 1),
    aqi: round(weighted('aqi'), 1),
    temperature: round(weighted('temperature'), 1),
    humidity: round(weighted('humidity'), 1),
    windSpeed: round(weighted('windSpeed'), 1),
    uvIndex: round(weighted('uvIndex'), 1),
    rainProbability: round(weighted('rainProbability'), 1),
    source: sources.join(' + '),
  };
}

function round(value: number, digits = 1) {
  const power = 10 ** digits;
  return Math.round(value * power) / power;
}
