import { CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import type { AcceptedPlan } from '../types';
import { shortTime } from '../utils';

export function AcceptedScreen({ plan, onDone }: { plan: AcceptedPlan; onDone: () => void }) {
  const next = plan.trips[0];
  const copy = () => next && navigator.clipboard?.writeText(`${next.origin} → ${next.destination}\nLeave ${next.recommended.departureTime}\n${next.recommended.label}`);
  return <div className="screen narrow accepted"><CheckCircle2 className="success-icon"/><p className="eyebrow">PLAN READY</p><h1>Your lower-exposure trip is set.</h1>{next && <section className="next-trip"><span>Your trip</span><h2>{next.origin} → {next.destination}</h2><dl><div><dt>Leave</dt><dd>{shortTime(next.recommended.departureTime)}</dd></div><div><dt>Recommended</dt><dd>{next.recommended.label}</dd></div></dl></section>}
    {next && <div className="two-actions"><button className="secondary" onClick={copy}><Copy/>Copy route</button><button className="secondary" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(next.origin)}&destination=${encodeURIComponent(next.destination)}`, '_blank')}><ExternalLink/>Open route</button></div>}
    <button className="primary full" onClick={onDone}>Back to start</button>
  </div>;
}
