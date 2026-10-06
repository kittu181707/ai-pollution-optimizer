import type { Coordinates, EnvironmentSnapshot } from '../types';

const cache = new Map<string, EnvironmentSnapshot>();
const pending = new Map<string, Promise<EnvironmentSnapshot>>();

export async function environmentAt(
  position: Coordinates,
  date: string,
  departureTime: string,
  demoMode: boolean,
): Promise<EnvironmentSnapshot> {
  if (demoMode) return demoEnvironment(position, departureTime);

  const hour = departureTime.slice(0, 2);
  const key = `${position.lat.toFixed(3)},${position.lon.toFixed(3)}|${date}T${hour}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const inFlight = pending.get(key);
  if (inFlight) return inFlight;

  const request = loadEnvironment(position, date, hour).then((result) => {
    cache.set(key, result);
    return result;
  }).finally(() => pending.delete(key));

  pending.set(key, request);
  return request;
}

async function loadEnvironment(position: Coordinates, date: string, hour: string): Promise<EnvironmentSnapshot> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${position.lat}&longitude=${position.lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,uv_index&forecast_days=3&timezone=auto`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${position.lat}&longitude=${position.lon}&hourly=pm10,pm2_5,us_aqi&forecast_days=3&timezone=auto`;
  const [weather, air] = await Promise.all([fetchJson(weatherUrl), fetchJson(airUrl)]);
  const targetPrefix = `${date}T${hour}:`;
  const weatherIndex = findTime(weather.hourly?.time, targetPrefix);
  const airIndex = findTime(air.hourly?.time, targetPrefix);

  return {
    pm25: requiredNumber(air.hourly?.pm2_5?.[airIndex], 'PM2.5', 0),
    pm10: requiredNumber(air.hourly?.pm10?.[airIndex], 'PM10', 0),
    aqi: requiredNumber(air.hourly?.us_aqi?.[airIndex], 'AQI', 0),
    temperature: requiredNumber(weather.hourly?.temperature_2m?.[weatherIndex], 'temperature'),
    humidity: requiredNumber(weather.hourly?.relative_humidity_2m?.[weatherIndex], 'humidity', 0),
    windSpeed: requiredNumber(weather.hourly?.wind_speed_10m?.[weatherIndex], 'wind speed', 0),
    uvIndex: requiredNumber(weather.hourly?.uv_index?.[weatherIndex], 'UV index', 0),
    rainProbability: requiredNumber(weather.hourly?.precipitation_probability?.[weatherIndex], 'rain probability', 0),
    source: 'Open-Meteo hourly environmental data',
  };
}

function demoEnvironment(position: Coordinates, time: string): EnvironmentSnapshot {
  const [hour, minute] = time.split(':').map(Number);
  const total = hour * 60 + minute;

  if (total < 660) {
    return snapshot(80, 118, 126, 25, 58, 7, 2, 5);
  }

  if (total < 1020) {
    const middayHotspot = { lat: 28.690794, lon: 77.167205 };
    const pm25 = distanceKm(position, middayHotspot) <= .15 ? 110 : 35;
    return snapshot(pm25, pm25 * 1.45, pm25 + 45, 38, 38, 10, 8.2, 8);
  }

  if (total < 1155) {
    const eveningHotspot = { lat: 28.62615, lon: 77.2231 };
    const pm25 = distanceKm(position, eveningHotspot) <= .8 ? 500 : 85;
    return snapshot(pm25, pm25 * 1.35, Math.min(500, pm25 + 55), 31, 52, 6, 2.8, 25);
  }

  const nightHotspot = { lat: 28.61705, lon: 77.21925 };
  const pm25 = distanceKm(position, nightHotspot) <= .8 ? 215 : 55;
  return snapshot(pm25, pm25 * 1.4, Math.min(400, pm25 + 45), 27, 72, 14, .2, 72);
}

function snapshot(
  pm25: number,
  pm10: number,
  aqi: number,
  temperature: number,
  humidity: number,
  windSpeed: number,
  uvIndex: number,
  rainProbability: number,
): EnvironmentSnapshot {
  return {
    pm25: round(pm25),
    pm10: round(pm10),
    aqi: round(aqi),
    temperature,
    humidity,
    windSpeed,
    uvIndex,
    rainProbability,
    source: 'Controlled demo environmental data',
  };
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
  if (!Number.isFinite(number) || (minimum !== undefined && number < minimum)) {
    throw new Error(`Environmental feed returned invalid ${label}`);
  }
  return number;
}

function distanceKm(a: Coordinates, b: Coordinates) {
  const radius = 6371;
  const radians = Math.PI / 180;
  const deltaLat = (b.lat - a.lat) * radians;
  const deltaLon = (b.lon - a.lon) * radians;
  const h = Math.sin(deltaLat / 2) ** 2
    + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin(deltaLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
