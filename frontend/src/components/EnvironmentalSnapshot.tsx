import { Gauge, Sun, ThermometerSun, Wind } from 'lucide-react';
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
  const maxTemp = Math.max(...samples.map((sample) => sample.environment.temperature));
  const maxUv = Math.max(...samples.map((sample) => sample.environment.uvIndex));

  return <section className="dashboard-card conditions-card" aria-label="Environmental conditions">
    <div className="card-heading compact">
      <div>
        <span className="section-kicker">Conditions</span>
        <h2>Along your day</h2>
      </div>
      <span className={analysis.workflow.dataMode === 'demo' ? 'data-badge demo' : 'data-badge live'}>
        {analysis.workflow.dataMode === 'demo' ? 'DEMO DATA' : 'LIVE DATA'}
      </span>
    </div>
    <div className="condition-grid">
      <div><Gauge size={17}/><span>AQI</span><strong>{aqi}</strong></div>
      <div><Wind size={17}/><span>PM2.5</span><strong>{pm25.toFixed(0)}</strong><small>µg/m³</small></div>
      <div><ThermometerSun size={17}/><span>Temp</span><strong>{maxTemp.toFixed(0)}°</strong></div>
      <div><Sun size={17}/><span>UV</span><strong>{maxUv.toFixed(1)}</strong></div>
    </div>
  </section>;
}
