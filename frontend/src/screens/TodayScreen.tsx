import { Search, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';
import { LiveEnvironmentSnapshot } from '../components/LiveEnvironmentSnapshot';
import type { AgendaPayload, JourneyInput } from '../types';

export function TodayScreen({
  agenda,
  journeys,
  busy,
  isDemo,
  onImport,
  onManual,
  onDemo,
  onAnalyze,
  error
}: {
  agenda: AgendaPayload;
  journeys: JourneyInput[];
  busy: boolean;
  isDemo: boolean;
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

      <LiveEnvironmentSnapshot homeLocation={agenda.homeLocation} isDemo={isDemo}/>

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
          <h3>Today's journeys</h3>
          <div className="timeline">
            {journeys.map((journey) => (
              <div key={journey.tripId} className="timeline-row">
                <div className="time">{journey.departureTime}</div>
                <div className="timeline-dot"></div>
                <div className="journey-summary">
                  <div className="journey-route">
                    <strong>{journey.origin}</strong> <ArrowRight size={14}/> <strong>{journey.destination}</strong>
                  </div>
                  <div className="journey-meta"><span>{journey.mode}</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="sticky-actions">
            <button className="primary large full" onClick={onAnalyze} disabled={busy}>
              {busy ? <Search className="spin" size={20}/> : <Search size={20}/>}
              <span>Optimize my day</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
