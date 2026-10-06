import { ArrowLeft, Check, Clock3, ShieldCheck } from 'lucide-react';
import type { DayAnalysis } from '../types';
import { ModeIcon } from '../components/ModeIcon';
import { shortTime } from '../utils';

export function FinalPlanScreen({ analysis, onBack, onAccept, busy, error }: {
  analysis: DayAnalysis; onBack: () => void; onAccept: () => void; busy: boolean; error?: string;
}) {
  return <div className="screen narrow">
    <div className="subnav"><button className="back compact" onClick={onBack}><ArrowLeft size={17}/>Today</button><span>Final plan</span></div>
    <div className="screen-title compact-title"><div className="eyebrow">READY</div><h1>Your optimized day.</h1></div>
    <div className="plan-summary">
      <div><strong>{'−' + analysis.metrics.pollutionReductionPct + '%'}</strong><span>modeled pollution</span></div>
      <div><strong>{'+' + analysis.metrics.extraTravelMinutes + ' min'}</strong><span>extra travel</span></div>
      <div><strong>0</strong><span>missed appointments</span></div>
    </div>
    <div className="final-timeline">
      {analysis.trips.map((trip) => <div className="final-trip" key={trip.tripId}>
        <div className={trip.changed ? 'timeline-marker changed' : 'timeline-marker'}>{trip.changed ? <ShieldCheck size={15}/> : <Check size={15}/>}</div>
        <div className="final-trip-main">
          <div className="final-route"><strong>{trip.origin}</strong><span>→</span><strong>{trip.destination}</strong></div>
          <div className="final-meta"><span><Clock3 size={14}/>{shortTime(trip.recommended.departureTime)}</span><span><ModeIcon mode={trip.recommended.mode} size={14}/>{trip.recommended.label}</span></div>
        </div>
        {trip.changed && <span className="changed-chip">Changed</span>}
      </div>)}
    </div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    <button className="primary cta full" disabled={busy} onClick={onAccept}>{busy ? 'Saving…' : 'Use this plan'}</button>
  </div>;
}
