import type { APIGatewayProxyEvent } from 'aws-lambda';
import { body, json } from '../http';
import type { Coordinates } from '../types';
import { currentEnvironmentAt } from '../services/environment';
import { geocode } from '../services/geocode';

type CurrentEnvironmentRequest = {
  position?: Partial<Coordinates>;
  location?: string;
};

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const input = body<CurrentEnvironmentRequest>(event.body);
    let position: Coordinates;

    const lat = Number(input.position?.lat);
    const lon = Number(input.position?.lon);

    if (Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lon) && lon >= -180 && lon <= 180) {
      position = { lat, lon };
    } else {
      const location = String(input.location || '').trim();
      if (!location || /^home$/i.test(location)) {
        return json(400, { message: 'A real location or browser position is required for live conditions' });
      }
      position = await geocode(location, false);
    }

    const environment = await currentEnvironmentAt(position);
    return json(200, { ...environment, position });
  } catch (error) {
    console.error('Live environment error:', error);
    return json(503, { message: 'Live environmental data is temporarily unavailable' });
  }
};
