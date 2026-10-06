import { createHash, createHmac } from 'node:crypto';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { TripAnalysis } from '../types';
import { body, json } from '../http';
import { getPlan } from '../services/persistence';

const ID_RE = /^[a-zA-Z0-9_-]{2,160}$/;

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const input = body<{ planId?: string; tripId?: string; change?: TripAnalysis }>(event.body);
    let trip: TripAnalysis | undefined;

    if (process.env.LOCAL_MODE === 'true' && input.change) {
      trip = input.change;
    } else {
      if (!ID_RE.test(input.planId || '') || !ID_RE.test(input.tripId || '')) {
        return json(400, { message: 'Invalid planId or tripId' });
      }
      const draft = await getPlan(input.planId!);
      trip = draft?.plan?.trips.find((candidate) => candidate.tripId === input.tripId);
      if (!trip) return json(404, { message: 'Trip not found in analyzed plan' });
    }

    if (process.env.LOCAL_MODE === 'true') {
      return json(200, { imageDataUrl: null, source: 'Local geometry preview' });
    }

    const image = await staticMap(trip);
    return json(200, image);
  } catch (error) {
    console.error('Static map error:', error);
    return json(503, { message: 'Amazon Location map is temporarily unavailable' });
  }
};

async function staticMap(trip: TripAnalysis) {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';
  const hostname = `maps.geo.${region}.amazonaws.com`;
  const overlay = compactOverlay(trip);
  const allPoints = [...trip.original.geometry, ...trip.recommended.geometry];
  const bounds = boundingBox(allPoints);

  const query: Record<string, string> = {
    style: 'Standard',
    width: '900',
    height: '420',
    padding: '42',
    'color-scheme': 'Light',
    'scale-unit': 'Kilometers',
    pois: 'Enabled',
    'compact-overlay': overlay,
  };
  if (bounds) query['bounding-box'] = bounds;

  const { SignatureV4 } = require('@smithy/signature-v4') as { SignatureV4: any };
  const { defaultProvider } = require('@aws-sdk/credential-provider-node') as { defaultProvider: () => any };
  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region,
    service: 'geo-maps',
    sha256: NodeSha256,
  });

  const signed = await signer.sign({
    protocol: 'https:',
    hostname,
    method: 'GET',
    path: '/v2/static/map',
    query,
    headers: { host: hostname },
  });

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(signed.query || query)) {
    if (Array.isArray(value)) value.forEach((entry) => search.append(key, String(entry)));
    else search.set(key, String(value));
  }

  const response = await fetch(`https://${hostname}/v2/static/map?${search.toString()}`, {
    headers: signed.headers as Record<string, string>,
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error(`Amazon Location Maps failed (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    imageDataUrl: `data:${response.headers.get('content-type') || 'image/jpeg'};base64,${bytes.toString('base64')}`,
    source: 'Amazon Location Maps V2 static map',
  };
}

function compactOverlay(trip: TripAnalysis) {
  const pieces = [
    line(trip.original.geometry, '#9b9691', 5),
    line(trip.recommended.geometry, '#137a50', 7),
  ];

  const samples = [...trip.original.environmentSamples, ...trip.recommended.environmentSamples];
  for (const sample of samples.slice(0, 8)) {
    pieces.push(`point:${sample.position.lon.toFixed(6)},${sample.position.lat.toFixed(6)};size=small;color=${pollutionColor(sample.environment.pm25)}`);
  }
  return pieces.filter(Boolean).join('|').slice(0, 4900);
}

function line(points: TripAnalysis['original']['geometry'], color: string, width: number) {
  const compact = downsample(points, 24).map((point) => `${point.lon.toFixed(6)},${point.lat.toFixed(6)}`).join(',');
  return compact ? `line:${compact};color=${color};width=${width}` : '';
}

function downsample<T>(items: T[], maximum: number) {
  if (items.length <= maximum) return items;
  return Array.from({ length: maximum }, (_, index) => items[Math.round(index * (items.length - 1) / (maximum - 1))]);
}

function pollutionColor(pm25: number) {
  if (pm25 >= 150) return '#b53a37';
  if (pm25 >= 75) return '#d47c24';
  return '#137a50';
}

function boundingBox(points: TripAnalysis['original']['geometry']) {
  if (!points.length) return undefined;
  const lons = points.map((point) => point.lon);
  const lats = points.map((point) => point.lat);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const lonPad = Math.max(.002, (maxLon - minLon) * .12);
  const latPad = Math.max(.002, (maxLat - minLat) * .12);
  return `${(minLon - lonPad).toFixed(6)},${(minLat - latPad).toFixed(6)},${(maxLon + lonPad).toFixed(6)},${(maxLat + latPad).toFixed(6)}`;
}

class NodeSha256 {
  private hash: ReturnType<typeof createHash> | ReturnType<typeof createHmac>;

  constructor(secret?: string | Uint8Array) {
    this.hash = secret === undefined
      ? createHash('sha256')
      : createHmac('sha256', secret);
  }

  update(data: string | Uint8Array) {
    this.hash.update(data);
  }

  async digest() {
    return Uint8Array.from(this.hash.digest());
  }
}
