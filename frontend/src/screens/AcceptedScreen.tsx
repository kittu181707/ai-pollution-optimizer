import { Check, Copy } from 'lucide-react';
import type { AcceptedPlan } from '../types';
import { ModeIcon } from '../components/ModeIcon';
import { RoutePreview } from '../components/RoutePreview';
import { shortTime, timeToMinutes } from '../utils';

function currentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function localDateToken() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
}

export function AcceptedScreen({ plan, onDone }: { plan: AcceptedPlan; onDone: () => void }) {
  const now = currentMinutes();
  const today = localDateToken();
  const next = plan.date > today
    ? plan.trips[0]
    : plan.date === today
      ? plan.trips.find((trip) => timeToMinutes(trip.recommended.departureTime) >= now) || plan.trips.at(-1)
      : undefined;

  const copy = async () => {
    if (!next || !navigator.clipboard) return;
    const text = [
      next.origin + ' → ' + next.destination,
      'Leave ' + next.recommended.departureTime,
      next.recommended.label,
      next.recommended.travelMinutes + ' min · ' + next.recommended.distanceKm.toFixed(1) + ' km',
      'Modeled pollution exposure ' + next.recommended.pollutionExposure.toFixed(0),
    ].join('\n');
    await navigator.clipboard.writeText(text).catch(() => undefined);
  };

  return <div className="screen narrow accepted">
    <div className="success-ring"><Check size={28}/></div>
    <div className="eyebrow">PLAN SAVED</div>
    <h1>Ready for today.</h1>

    {next && <section className="next-trip">
      <div className="section-row"><strong>Next optimized trip</strong><span>{shortTime(next.recommended.departureTime)}</span></div>
      <div className="next-route"><strong>{next.origin}</strong><span>→</span><strong>{next.destination}</strong></div>
      <div className="next-mode"><ModeIcon mode={next.recommended.mode}/><span>{next.recommended.label}</span></div>
      <div className="accepted-route-note">This is the accepted recommendation; the route geometry below is the same geometry analyzed by the optimizer.</div>
    </section>}

    {next && <div className="accepted-route-preview"><RoutePreview planId={plan.planId} trip={next}/></div>}

    {next && <div className="two-actions single">
      <button className="secondary" onClick={copy}><Copy size={17}/>Copy recommendation</button>
    </div>}

    <button className="primary full" onClick={onDone}>Back to today</button>
  </div>;
}
