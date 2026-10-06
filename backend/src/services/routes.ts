import type { BaseRoute, Coordinates, TransportMode } from '../types';

let clientPromise: Promise<any> | null = null;

async function client() {
  if (!clientPromise) {
    clientPromise = import('@aws-sdk/client-geo-routes').then(({ GeoRoutesClient }) => new GeoRoutesClient({}));
  }
  return clientPromise;
}

export async function routesForTrip(input: {
  origin: Coordinates;
  destination: Coordinates;
  mode: TransportMode;
  date: string;
  departureTime: string;
  arriveBy?: string;
  demoMode: boolean;
  tripOrdinal: number;
}): Promise<BaseRoute[]> {
  if (input.demoMode) return demoRoutes(input);
  if (input.mode === 'bike') {
    throw new Error('Bike routing is unavailable from the configured live route provider');
  }

  const { CalculateRoutesCommand } = await import('@aws-sdk/client-geo-routes');
  const travelMode = input.mode === 'walk'
    ? 'Pedestrian'
    : (input.mode === 'bus' || input.mode === 'metro')
      ? 'Transit'
      : 'Car';

  const command: any = {
    Origin: [input.origin.lon, input.origin.lat],
    Destination: [input.destination.lon, input.destination.lat],
    TravelMode: travelMode,
    MaxAlternatives: 2,
    LegGeometryFormat: 'Simple',
    LegAdditionalFeatures: ['Summary'],
    DepartureTime: departureIso(input.date, input.departureTime),
  };

  if (travelMode === 'Transit') {
    command.TravelModeOptions = {
      Transit: {
        AllowedModes: input.mode === 'bus'
          ? ['Bus', 'BusRapidTransit', 'PrivateBus']
          : ['Subway', 'CityTrain', 'LightRail', 'Monorail'],
      },
    };
  }

  const response: any = await (await client()).send(new CalculateRoutesCommand(command));
  const routes: any[] = response.Routes || [];
  if (!routes.length) throw new Error(`Amazon Location returned no ${input.mode} route`);

  return routes.slice(0, 3).map((route, index) => {
    const durationSeconds = Number(route.Summary?.Duration);
    const distanceMeters = Number(route.Summary?.Distance);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !Number.isFinite(distanceMeters) || distanceMeters < 0) {
      throw new Error('Amazon Location returned an incomplete route summary');
    }

    const geometry = (route.Legs || []).flatMap((leg: any) =>
      (leg.Geometry?.LineString || []).map((point: number[]) => ({ lon: point[0], lat: point[1] })),
    );

    return {
      routeId: `aws-${input.mode}-${index}`,
      mode: input.mode,
      label: index ? `${label(input.mode)} · alternate ${index}` : label(input.mode),
      travelMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      distanceKm: Math.max(.1, distanceMeters / 1000),
      geometry: geometry.length ? geometry : [input.origin, input.destination],
      source: 'Amazon Location Routes V2',
    };
  });
}

function departureIso(date: string, time: string) {
  const offset = process.env.APP_TIMEZONE_OFFSET || '+05:30';
  if (offset !== 'Z' && !/^[+-](?:0\d|1\d|2[0-3]):[0-5]\d$/.test(offset)) {
    throw new Error('Invalid APP_TIMEZONE_OFFSET');
  }
  return `${date}T${time}:00${offset}`;
}

function demoRoutes(input: {
  origin: Coordinates;
  destination: Coordinates;
  mode: TransportMode;
  departureTime: string;
  tripOrdinal: number;
}) {
  const baseDistance = Math.max(2, haversine(input.origin, input.destination) * 1.18);
  const speeds: Record<TransportMode, number> = { car: 28, bike: 15, bus: 23, metro: 31, walk: 4.8 };
  const modifiers: Record<TransportMode, number> = { car: 1, bike: 1.08, bus: 1.12, metro: 1.15, walk: 1.02 };
  let minutes = Math.round(baseDistance * modifiers[input.mode] / speeds[input.mode] * 60);
  if (input.mode === 'metro') minutes += 7;
  if (input.mode === 'bus') minutes += 6;

  if (input.tripOrdinal === 1 && input.mode === 'metro') minutes = 43;
  if (input.tripOrdinal === 1 && input.mode === 'bus') minutes = 45;

  if (input.tripOrdinal === 2) {
    const planned: Record<TransportMode, number> = { car: 23, bike: 12, bus: 25, metro: 20, walk: 26 };
    minutes = planned[input.mode];
  }

  if (input.tripOrdinal === 3) {
    const planned: Record<TransportMode, number> = { car: 19, bike: 11, bus: 13, metro: 13, walk: 33 };
    minutes = planned[input.mode];
  }

  const offset = demoOffset(input.tripOrdinal, input.mode);
  const base = {
    routeId: `demo-${input.mode}-0`,
    mode: input.mode,
    label: label(input.mode),
    travelMinutes: minutes,
    distanceKm: round(baseDistance * modifiers[input.mode]),
    geometry: bend(input.origin, input.destination, offset),
    source: 'Controlled demo route data',
  };

  return input.mode === 'car'
    ? [base, {
      ...base,
      routeId: `demo-${input.mode}-1`,
      label: 'Car · alternate road',
      travelMinutes: minutes + 5,
      distanceKm: round(base.distanceKm * 1.08),
      geometry: bend(input.origin, input.destination, offset + .02),
    }]
    : [base];
}

function demoOffset(tripOrdinal: number, mode: TransportMode) {
  if (tripOrdinal === 1 && mode === 'bus') return .05;
  if (tripOrdinal === 2 && mode === 'bus') return .04;
  if (tripOrdinal === 3 && mode === 'bike') return .04;
  return 0;
}

function label(mode: TransportMode) {
  return ({ car: 'Car', bike: 'Bike', bus: 'Bus', metro: 'Metro + walk', walk: 'Walk' } as Record<TransportMode, string>)[mode];
}

function haversine(a: Coordinates, b: Coordinates) {
  const radius = 6371;
  const radians = Math.PI / 180;
  const deltaLat = (b.lat - a.lat) * radians;
  const deltaLon = (b.lon - a.lon) * radians;
  const h = Math.sin(deltaLat / 2) ** 2
    + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(deltaLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function bend(a: Coordinates, b: Coordinates, offset: number) {
  return [
    a,
    { lat: (a.lat + b.lat) / 2 + offset, lon: (a.lon + b.lon) / 2 - offset },
    b,
  ];
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
