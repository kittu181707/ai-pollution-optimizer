import { CloudSun, Gauge, Sun, ThermometerSun, Wind } from 'lucide-react';
import type { DayAnalysis, RouteEnvironmentSample } from '../types';

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

export function EnvironmentalSnapshot({ analysis }: { analysis: DayAnalysis }) {
  const samples = analysis.trips.flatMap((trip) => trip.recommended.environmentSamples);
  if (!samples.length) return null;

  const aqi = Math.round(weighted(samples, (sample) => sample.environment.aqi));
  const pm25 = weighted(samples, (sample) => sample.environment.pm25);
  const pm10 = weighted(samples, (sample) => sample.environment.pm10);
  const maxTemp = Math.max(...samples.map((sample) => sample.environment.temperature));
  const maxUv = Math.max(...samples.map((sample) => sample.environment.uvIndex));
  const wind = weighted(samples, (sample) => sample.environment.windSpeed);

  return <section className="environment-ribbon" aria-label="Environmental conditions along today's routes">
    <div className="env-context">
      <span className="env-context-icon"><CloudSun size={25}/></span>
      <span><small>Along your routes</small><strong>{maxTemp.toFixed(0)}°C</strong><em>{aqiLabel(aqi)} air</em></span>
    </div>
    <div className="env-signal"><Gauge size={15}/><span>AQI</span><strong>{aqi}</strong><small>{aqiLabel(aqi)}</small></div>
    <div className="env-signal"><Wind size={15}/><span>PM2.5</span><strong>{pm25.toFixed(0)}</strong><small>µg/m³</small></div>
    <div className="env-signal"><Wind size={15}/><span>PM10</span><strong>{pm10.toFixed(0)}</strong><small>µg/m³</small></div>
    <div className="env-signal"><Sun size={15}/><span>UV</span><strong>{maxUv.toFixed(1)}</strong><small>peak</small></div>
    <div className="env-source">
      <span className={analysis.workflow.dataMode === 'demo' ? 'data-badge demo' : 'data-badge live'}>
        {analysis.workflow.dataMode === 'demo' ? 'DEMO DATA' : 'LIVE DATA'}
      </span>
      <small>Route data</small>
      <strong>{analysis.workflow.dataMode === 'demo' ? 'Controlled demo' : 'Live environmental feed'}</strong>
      <em><ThermometerSun size={13}/>{wind.toFixed(0)} km/h wind</em>
    </div>
  </section>;
}
