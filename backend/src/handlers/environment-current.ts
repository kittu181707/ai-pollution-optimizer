import type { APIGatewayProxyEvent } from 'aws-lambda';
import { body, json } from '../http';
import { currentEnvironmentAt } from '../services/environment';

type CurrentEnvironmentRequest = {
  position?: { lat?: number; lon?: number };
};

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const input = body<CurrentEnvironmentRequest>(event.body);
    const lat = Number(input.position?.lat);
    const lon = Number(input.position?.lon);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      return json(400, { message: 'A valid latitude and longitude are required' });
    }

    const environment = await currentEnvironmentAt({ lat, lon });
    return json(200, environment);
  } catch (error) {
    console.error('Live environment error:', error);
    return json(503, { message: 'Live environmental data is temporarily unavailable' });
  }
};
