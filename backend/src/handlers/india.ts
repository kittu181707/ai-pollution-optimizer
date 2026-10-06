import type { APIGatewayProxyResult } from 'aws-lambda';
import { json } from '../http';
import { environmentAt } from '../services/environment';

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const date = new Date().toISOString().split('T')[0];
    // Use an approximate current time for the snapshot
    const time = '12:00';
    const demoMode = process.env.DEMO_MODE === 'true';
    
    const stations = [
      { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
      { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
      { name: 'Guntur', lat: 16.3067, lon: 80.4365 },
    ];
    
    const results = await Promise.all(stations.map(async (s) => {
      try {
        const env = await environmentAt(s, date, time, demoMode);
        return {
          ...s,
          aqi: env.aqi,
          pm25: env.pm25,
          pm10: env.pm10,
          source: env.source,
          updated: demoMode ? 'Demo' : 'Live'
        };
      } catch (e) {
        return {
          ...s,
          aqi: 0, pm25: 0, pm10: 0,
          source: 'Unavailable', updated: 'Unknown'
        }
      }
    }));
    
    return json(200, { stations: results });
  } catch (e) {
    return json(500, { message: 'Failed to fetch India data' });
  }
};
