import { Cloud, MapPin, Search, Wind, Sun, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';
import type { AgendaPayload, JourneyInput } from '../types';

export function TodayScreen({
  agenda,
  journeys,
  busy,
  onImport,
  onManual,
  onDemo,
  onAnalyze,
  error
}: {
  agenda: AgendaPayload;
  journeys: JourneyInput[];
  busy: boolean;
  onImport: () => void;
  onManual: () => void;
  onDemo: () => void;
  onAnalyze: () => void;
  error?: string;
}) {
  const hasAgenda = agenda && agenda.events.length > 0;

  return (
    <div className="screen wide today-screen">
      <div className="screen-title">
        <h1>Good morning.<br/>Here's your environmental plan for today.</h1>
      </div>

      <div className="snapshot-card">
        <div className="snapshot-header">
          <h3>Environmental Snapshot</h3>
          <span className="location-badge"><MapPin size={14}/> {agenda.homeLocation || 'Delhi (Default)'}</span>
        </div>
        <div className="snapshot-grid">
          <div className="snapshot-metric">
            <span className="label">AQI</span>
            <strong>86</strong>
            <span className="status moderate">Moderate</span>
          </div>
          <div className="snapshot-metric">
            <span className="label">PM2.5</span>
            <strong>32 µg/m³</strong>
          </div>
          <div className="snapshot-metric">
            <span className="label">PM10</span>
            <strong>85 µg/m³</strong>
          </div>
          <div className="snapshot-metric">
            <span className="label"><Sun size={14}/> UV</span>
            <strong>High</strong>
          </div>
          <div className="snapshot-metric">
            <span className="label"><Wind size={14}/> Wind</span>
            <strong>12 km/h</strong>
          </div>
          <div className="snapshot-metric">
            <span className="label"><Cloud size={14}/> Rain</span>
            <strong>0%</strong>
          </div>
        </div>
        <div className="snapshot-footer">
          Source: CPCB • Updated 4 min ago
        </div>
      </div>

      {error && <div className="error-banner"><AlertTriangle size={16}/> {error}</div>}

      {!hasAgenda ? (
        <div className="empty-agenda">
          <p>You don't have any journeys planned yet.</p>
          <div className="actions">
            <button className="primary" onClick={onImport} disabled={busy}><Calendar size={18}/> Import Agenda</button>
            <button className="secondary" onClick={onManual} disabled={busy}>Plan Manually</button>
            <button className="text-button" onClick={onDemo} disabled={busy}>Load Demo Day</button>
          </div>
        </div>
      ) : (
        <div className="today-journeys">
          <h3>Today's Journeys</h3>
          <div className="timeline">
            {journeys.map((j, i) => (
              <div key={i} className="timeline-row">
                <div className="time">{j.departureTime}</div>
                <div className="timeline-dot"></div>
                <div className="journey-summary">
                  <div className="journey-route">
                    <strong>{j.origin}</strong> <ArrowRight size={14}/> <strong>{j.destination}</strong>
                  </div>
                  <div className="journey-meta">
                    <span>{j.mode}</span>
                  </div>
                  <div className="journey-env">
                    <span className="env-badge aqi-high">AQI High</span>
                    <span className="env-badge heat-mod">Heat Moderate</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="sticky-actions">
            <button className="primary large full" onClick={onAnalyze} disabled={busy}>
              {busy ? <Search className="spin" size={20}/> : <Search size={20}/>}
              <span>Optimize My Day</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
