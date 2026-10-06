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
  tripOrdinal: number;
}): Promise<BaseRoute[]> {
  if (input.mode === 'bike') return [bikeHeuristic(input.origin, input.destination)];

  const { CalculateRoutesCommand } = await import('@aws-sdk/client-geo-routes');
  const travelMode = input.mode === 'walk' ? 'Pedestrian' : (input.mode === 'bus' || input.mode === 'metro') ? 'Transit' : 'Car';

  const command: any = {
    Origin: [input.origin.lon, input.origin.lat],
    Destination: [input.destination.lon, input.destination.lat],
    TravelMode: travelMode,
    MaxAlternatives: 1,
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

  return routes.slice(0, 2).map((route, index) => {
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
      label: index ? `${label(input.mode)} · alternate` : label(input.mode),
      travelMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      distanceKm: Math.max(0.1, distanceMeters / 1000),
      geometry: geometry.length ? geometry : [input.origin, input.destination],
      source: 'Amazon Location Routes V2',
    };
  });
}

function departureIso(date: string, time: string) {
  const offset = process.env.APP_TIMEZONE_OFFSET || '+05:30';
  if (offset !== 'Z' && !/^[+-](?:0\d|1\d|2[0-3]):[0-5]\d$/.test(offset)) throw new Error('Invalid APP_TIMEZONE_OFFSET');
  return `${date}T${time}:00${offset}`;
}

function bikeHeuristic(origin: Coordinates, destination: Coordinates): BaseRoute {
  const distance = haversine(origin, destination) * 1.12;
  return {
    routeId: 'bike-heuristic',
    mode: 'bike',
    label: 'Bike',
    travelMinutes: Math.max(4, Math.round(distance / 15 * 60)),
    distanceKm: round(distance),
    geometry: [origin, destination],
    source: 'AWS Lambda bike heuristic',
  };
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
  return [a, { lat: (a.lat + b.lat) / 2 + offset, lon: (a.lon + b.lon) / 2 - offset }, b];
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
