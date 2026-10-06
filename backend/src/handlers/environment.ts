import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const lat = event.queryStringParameters?.lat;
    const lon = event.queryStringParameters?.lon;

    if (!lat || !lon) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing lat/lon parameters" }) };
    }

    const DEMO_MODE = process.env.DEMO_MODE === 'true';

    if (DEMO_MODE) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          location: { lat: parseFloat(lat), lon: parseFloat(lon) },
          timestamp: new Date().toISOString(),
          pm25: 155.4,
          pm10: 210.2,
          aqi: 205, // estimated based on pm25
          temperature: 32,
          humidity: 45,
          windSpeed: 8,
          source: 'Demo Fallback Data',
          isLive: false
        }),
      };
    }

    // Call Real APIs
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide`;

    const [weatherRes, aqRes] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(aqUrl)
    ]);

    const currentAq = aqRes.data.current || {};
    const currentWeather = weatherRes.data.current || {};

    // Very naive AQI estimate from PM2.5 just for display purposes
    const pm25 = currentAq.pm2_5 || 0;
    let aqi = 50;
    if (pm25 > 250) aqi = 400;
    else if (pm25 > 150) aqi = 300;
    else if (pm25 > 90) aqi = 200;
    else if (pm25 > 35) aqi = 100;
    else aqi = Math.round(pm25 * 2);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        location: { lat: parseFloat(lat), lon: parseFloat(lon) },
        timestamp: new Date().toISOString(),
        pm25: pm25,
        pm10: currentAq.pm10 || 0,
        aqi: aqi,
        temperature: currentWeather.temperature_2m || 0,
        humidity: currentWeather.relative_humidity_2m || 0,
        windSpeed: currentWeather.wind_speed_10m || 0,
        source: 'Open-Meteo Live API',
        isLive: true
      }),
    };

  } catch (err) {
    console.error('Environment API Error:', err);
    // Fallback on error
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        pm25: 150,
        pm10: 200,
        aqi: 200,
        temperature: 30,
        humidity: 50,
        windSpeed: 10,
        source: 'Demo Fallback Data (API Failed)',
        isLive: false
      })
    };
  }
};
