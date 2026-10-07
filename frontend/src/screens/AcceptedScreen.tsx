import { CheckCircle2, Copy } from 'lucide-react';
import type { AcceptedPlan } from '../types';
import { shortTime } from '../utils';

function minutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function localDateToken() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function currentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function AcceptedScreen({ plan, onDone }: { plan: AcceptedPlan; onDone: () => void }) {
  const today = localDateToken();
  const next = plan.date > today
    ? plan.trips[0]
    : plan.date === today
      ? plan.trips.find((trip) => minutes(trip.recommended.departureTime) >= currentMinutes()) || plan.trips.at(-1)
      : undefined;

  const copy = () => next && navigator.clipboard?.writeText(
    `${next.origin} → ${next.destination}\nLeave ${next.recommended.departureTime}\n${next.recommended.label}`,
  );

  return <div className="screen narrow accepted">
    <CheckCircle2 className="success-icon"/>
    <p className="eyebrow">PLAN READY</p>
    <h1>Your lower-exposure day is set.</h1>
    {next ? <section className="next-trip">
      <span>Next trip</span>
      <h2>{next.origin} → {next.destination}</h2>
      <dl>
        <div><dt>Leave</dt><dd>{shortTime(next.recommended.departureTime)}</dd></div>
        <div><dt>Recommended</dt><dd>{next.recommended.label}</dd></div>
      </dl>
      <button className="secondary full" onClick={copy}><Copy/>Copy route</button>
    </section> : <section className="next-trip"><span>Plan complete</span><h2>No remaining journeys in this plan.</h2></section>}
    <button className="primary full" onClick={onDone}>Back to today</button>
  </div>;
}
