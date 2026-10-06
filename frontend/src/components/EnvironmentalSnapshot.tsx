import { CloudSun, Gauge, RefreshCw, Sun, ThermometerSun, Wind } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { DayAnalysis, EnvironmentSnapshot, RouteEnvironmentSample } from '../types';

function weighted(samples: RouteEnvironmentSample[], pick: (sample: RouteEnvironmentSample) => number) {
  const total = samples.reduce((sum, sample) => sum + sample.minutes, 0);
  if (!total) return 0;
  return samples.reduce((sum, sample) => sum + pick(sample) * sample.minutes, 0) / total;
}

function aqiLabel(value: number) {
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Moderate';
  if (value <= 150) return 'Sensitive';
  if (value <= 200) return 'High';
  return 'Very high';
}

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function ageLabel(value?: string) {
  if (!value) return 'fresh analysis';
  const ageMs = Date.now() - Date.parse(value);
  if (!Number.isFinite(ageMs) || ageMs < 60_000) return 'updated now';
  const minutes = Math.max(1, Math.round(ageMs / 60_000));
  return `updated ${minutes} min ago`;
}

function aggregate(samples: RouteEnvironmentSample[]): EnvironmentSnapshot {
  return {
    aqi: Math.round(weighted(samples, (sample) => sample.environment.aqi)),
    pm25: weighted(samples, (sample) => sample.environment.pm25),
    pm10: weighted(samples, (sample) => sample.environment.pm10),
    temperature: Math.max(...samples.map((sample) => sample.environment.temperature)),
    humidity: weighted(samples, (sample) => sample.environment.humidity),
    windSpeed: weighted(samples, (sample) => sample.environment.windSpeed),
    uvIndex: Math.max(...samples.map((sample) => sample.environment.uvIndex)),
    rainProbability: Math.max(...samples.map((sample) => sample.environment.rainProbability)),
    source: samples[0]?.environment.source || 'Route environmental data',
    updatedAt: samples.map((sample) => sample.environment.updatedAt).filter(Boolean).sort().at(-1),
  };
}

export function EnvironmentalSnapshot({ analysis }: { analysis: DayAnalysis }) {
  const samples = analysis.trips.flatMap((trip) => trip.recommended.environmentSamples);
  const routeSnapshot = useMemo(() => samples.length ? aggregate(samples) : null, [analysis.planId]);
  const focusTrip = analysis.changes[0] || analysis.trips[0];
  const focusSamples = focusTrip?.recommended.environmentSamples || [];
  const focusPosition = focusSamples[Math.floor(focusSamples.length / 2)]?.position
    || focusTrip?.recommended.geometry[Math.floor(focusTrip.recommended.geometry.length / 2)];

  const shouldRefresh = Boolean(
    focusPosition
    && analysis.workflow.dataMode === 'live'
    && analysis.date === localDate()
  );

  const [live, setLive] = useState<EnvironmentSnapshot | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, setClock] = useState(0);

  useEffect(() => {
    setLive(null);
    if (!shouldRefresh || !focusPosition) return;

    let active = true;
    const refresh = async () => {
      setRefreshing(true);
      try {
        const next = await api.currentEnvironment(focusPosition);
        if (active) setLive(next);
      } catch {
        // Keep the route forecast already returned by the optimizer.
      } finally {
        if (active) setRefreshing(false);
      }
    };

    void refresh();
    const dataTimer = window.setInterval(() => void refresh(), 5 * 60_000);
    const clockTimer = window.setInterval(() => setClock((value) => value + 1), 60_000);
    return () => {
      active = false;
      window.clearInterval(dataTimer);
      window.clearInterval(clockTimer);
    };
  }, [analysis.planId, shouldRefresh, focusPosition?.lat, focusPosition?.lon]);

  if (!routeSnapshot) return null;
  const display = live || routeSnapshot;
  const isDemo = analysis.workflow.dataMode === 'demo';
  const freshness = isDemo ? 'controlled data' : ageLabel(display.updatedAt);

  return <section className="environment-ribbon" aria-label="Environmental conditions along today's routes">
    <div className="env-context">
      <span className="env-context-icon"><CloudSun size={25}/></span>
      <span><small>{live ? 'Live near route' : 'Along your routes'}</small><strong>{display.temperature.toFixed(0)}°C</strong><em>{aqiLabel(display.aqi)} air</em></span>
    </div>
    <div className="env-signal"><Gauge size={15}/><span>AQI</span><strong>{Math.round(display.aqi)}</strong><small>{aqiLabel(display.aqi)}</small></div>
    <div className="env-signal"><Wind size={15}/><span>PM2.5</span><strong>{display.pm25.toFixed(0)}</strong><small>µg/m³</small></div>
    <div className="env-signal"><Wind size={15}/><span>PM10</span><strong>{display.pm10.toFixed(0)}</strong><small>µg/m³</small></div>
    <div className="env-signal"><Sun size={15}/><span>UV</span><strong>{display.uvIndex.toFixed(1)}</strong><small>peak</small></div>
    <div className="env-source">
      <span className={isDemo ? 'data-badge demo' : 'data-badge live'}>
        {isDemo ? 'DEMO DATA' : live ? 'LIVE NOW' : 'LIVE FEED'}
      </span>
      <small>Environmental source</small>
      <strong title={display.source}>{display.source}</strong>
      <em>{refreshing ? <><RefreshCw size={13} className="spin"/>Refreshing</> : <><ThermometerSun size={13}/>{freshness}</>}</em>
    </div>
  </section>;
}
