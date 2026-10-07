import type { APIGatewayProxyResult } from 'aws-lambda';
import { json } from '../http';
import { currentEnvironmentAt, environmentAt } from '../services/environment';

const STATIONS = [
  { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Guntur', lat: 16.3067, lon: 80.4365 },
];

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const demoMode = process.env.DEMO_MODE === 'true';
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const hour = now.toISOString().slice(11, 13) + ':00';

    const stations = await Promise.all(STATIONS.map(async (station) => {
      try {
        const environment = demoMode
          ? await environmentAt(station, date, hour, true)
          : await currentEnvironmentAt(station);

        return {
          ...station,
          aqi: environment.aqi,
          pm25: environment.pm25,
          pm10: environment.pm10,
          source: environment.source,
          updated: environment.updatedAt || (demoMode ? 'Demo' : 'Live'),
        };
      } catch {
        return {
          ...station,
          aqi: 0,
          pm25: 0,
          pm10: 0,
          source: 'Unavailable',
          updated: 'Unknown',
        };
      }
    }));

    return json(200, { stations });
  } catch (error) {
    console.error('India live data error:', error);
    return json(500, { message: 'Failed to fetch India data' });
  }
};
