import { ArrowLeft, Check, Clock3, ShieldCheck } from 'lucide-react';
import type { DayAnalysis } from '../types';
import { shortTime } from '../utils';

export function FinalPlanScreen({ analysis, onBack, onAccept, busy }: { analysis: DayAnalysis; onBack: () => void; onAccept: () => void; busy: boolean }) {
  return <div className="screen narrow"><button className="back" onClick={onBack}><ArrowLeft/>Changes</button><div className="screen-title"><p className="eyebrow">YOUR OPTIMIZED TRIP</p><h1>Same destination. Healthier route.</h1></div>
    <div className="timeline">{analysis.trips.map((trip) => <div className="timeline-row" key={trip.tripId}><span className="timeline-dot"/><div><strong>{shortTime(trip.recommended.departureTime)} · {trip.origin} → {trip.destination}</strong><p>{trip.changed ? `${trip.recommended.label} · ${trip.recommended.travelMinutes - trip.original.travelMinutes >= 0 ? '+' : ''}${trip.recommended.travelMinutes - trip.original.travelMinutes} min` : 'No change'}</p></div>{trip.changed ? <ShieldCheck/> : <Check/>}</div>)}</div>
    <section className="summary-card"><div><Clock3/><span>Total extra travel</span><strong>+{analysis.metrics.extraTravelMinutes} min</strong></div><div><ShieldCheck/><span>Modeled exposure reduction</span><strong>{analysis.metrics.exposureReductionPct}%</strong></div></section>
    <button className="primary full" disabled={busy} onClick={onAccept}>{busy ? 'Saving plan…' : 'Use this plan'}</button>
  </div>;
}
