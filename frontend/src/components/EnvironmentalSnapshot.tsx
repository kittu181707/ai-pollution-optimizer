import { CloudRain, Gauge, Sun, ThermometerSun, Wind } from 'lucide-react';
import type { DayAnalysis, RouteEnvironmentSample } from '../types';

function weighted(samples: RouteEnvironmentSample[], pick: (sample: RouteEnvironmentSample) => number) {
  const total = samples.reduce((sum, sample) => sum + sample.minutes, 0);
  if (!total) return 0;
  return samples.reduce((sum, sample) => sum + pick(sample) * sample.minutes, 0) / total;
}

export function EnvironmentalSnapshot({ analysis }: { analysis: DayAnalysis }) {
  const samples = analysis.trips.flatMap((trip) => trip.recommended.environmentSamples);
  if (!samples.length) return null;

  const aqi = Math.round(weighted(samples, (sample) => sample.environment.aqi));
  const pm25 = weighted(samples, (sample) => sample.environment.pm25);
  const pm10 = weighted(samples, (sample) => sample.environment.pm10);
  const maxTemp = Math.max(...samples.map((sample) => sample.environment.temperature));
  const maxUv = Math.max(...samples.map((sample) => sample.environment.uvIndex));
  const maxRain = Math.max(...samples.map((sample) => sample.environment.rainProbability));

  return <section className="environment-snapshot" aria-label="Route-weighted environmental snapshot">
    <div className="snapshot-head">
      <div>
        <div className="eyebrow">ENVIRONMENTAL SNAPSHOT</div>
        <h3>Conditions along the optimized day</h3>
      </div>
      <span className={analysis.workflow.dataMode === 'demo' ? 'data-badge demo' : 'data-badge live'}>
        {analysis.workflow.dataMode === 'demo' ? 'DEMO DATA' : 'LIVE HOURLY FEED'}
      </span>
    </div>
    <div className="snapshot-grid">
      <div><Gauge size={17}/><span>AQI</span><strong>{aqi}</strong><small>route-weighted</small></div>
      <div><Wind size={17}/><span>PM2.5</span><strong>{pm25.toFixed(0)}</strong><small>µg/m³ avg</small></div>
      <div><Wind size={17}/><span>PM10</span><strong>{pm10.toFixed(0)}</strong><small>µg/m³ avg</small></div>
      <div><ThermometerSun size={17}/><span>Temperature</span><strong>{maxTemp.toFixed(0)}°</strong><small>route max</small></div>
      <div><Sun size={17}/><span>UV index</span><strong>{maxUv.toFixed(1)}</strong><small>route max</small></div>
      <div><CloudRain size={17}/><span>Rain</span><strong>{maxRain.toFixed(0)}%</strong><small>route max</small></div>
    </div>
  </section>;
}
