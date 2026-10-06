import type { Coordinates, EnvironmentSnapshot } from '../types';

const cache = new Map<string, EnvironmentSnapshot>();

export async function environmentAt(
  position: Coordinates,
  date: string,
  departureTime: string
): Promise<EnvironmentSnapshot> {
  const hour = departureTime.slice(0, 2);
  const key = `${position.lat.toFixed(3)},${position.lon.toFixed(3)}|${date}T${hour}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${position.lat}&longitude=${position.lon}&hourly=temperature_2m,precipitation_probability,uv_index&forecast_days=3&timezone=auto`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${position.lat}&longitude=${position.lon}&hourly=pm10,pm2_5,us_aqi&forecast_days=3&timezone=auto`;
  const [weather, air] = await Promise.all([fetchJson(weatherUrl), fetchJson(airUrl)]);
  const targetPrefix = `${date}T${hour}:`;
  const weatherIndex = findTime(weather.hourly?.time, targetPrefix);
  const airIndex = findTime(air.hourly?.time, targetPrefix);

  const result = {
    pm25: requiredNumber(air.hourly?.pm2_5?.[airIndex], 'PM2.5', 0),
    pm10: requiredNumber(air.hourly?.pm10?.[airIndex], 'PM10', 0),
    aqi: requiredNumber(air.hourly?.us_aqi?.[airIndex], 'AQI', 0),
    temperature: requiredNumber(weather.hourly?.temperature_2m?.[weatherIndex], 'temperature'),
    uvIndex: requiredNumber(weather.hourly?.uv_index?.[weatherIndex], 'UV index', 0),
    rainProbability: requiredNumber(weather.hourly?.precipitation_probability?.[weatherIndex], 'rain probability', 0),
    source: 'Open-Meteo hourly environmental data',
  };

  cache.set(key, result);
  return result;
}

async function fetchJson(url: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error(`Environmental feed failed (${response.status})`);
      return await response.json() as any;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Environmental feed unavailable');
}

function findTime(times: unknown, prefix: string) {
  if (!Array.isArray(times)) throw new Error('Environmental feed returned no timeline');
  const index = times.findIndex((time) => typeof time === 'string' && time.startsWith(prefix));
  if (index < 0) throw new Error('Environmental data is unavailable for the selected day/time');
  return index;
}

function requiredNumber(value: unknown, label: string, minimum?: number) {
  if (value === null || value === undefined || value === '') throw new Error(`Environmental feed is missing ${label}`);
  const number = Number(value);
  if (!Number.isFinite(number) || (minimum !== undefined && number < minimum)) throw new Error(`Environmental feed returned invalid ${label}`);
  return number;
}
