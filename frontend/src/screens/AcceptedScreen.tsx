import { Check, Copy, ExternalLink } from 'lucide-react';
import type { AcceptedPlan } from '../types';
import { ModeIcon } from '../components/ModeIcon';
import { shortTime } from '../utils';

export function AcceptedScreen({ plan, onDone }: { plan: AcceptedPlan; onDone: () => void }) {
  const next = plan.trips[0];
  const copy = async () => {
    if (!next || !navigator.clipboard) return;
    const text = next.origin + ' → ' + next.destination + '\nLeave ' + next.recommended.departureTime + '\n' + next.recommended.label;
    await navigator.clipboard.writeText(text).catch(() => undefined);
  };
  return <div className="screen narrow accepted">
    <div className="success-ring"><Check size={28}/></div>
    <div className="eyebrow">PLAN SAVED</div>
    <h1>Ready for today.</h1>
    {next && <section className="next-trip">
      <div className="section-row"><strong>Next trip</strong><span>{shortTime(next.recommended.departureTime)}</span></div>
      <div className="next-route"><strong>{next.origin}</strong><span>→</span><strong>{next.destination}</strong></div>
      <div className="next-mode"><ModeIcon mode={next.recommended.mode}/><span>{next.recommended.label}</span></div>
    </section>}
    {next && <div className="two-actions">
      <button className="secondary" onClick={copy}><Copy size={17}/>Copy</button>
      <button className="secondary" onClick={() => window.open('https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(next.origin) + '&destination=' + encodeURIComponent(next.destination), '_blank', 'noopener,noreferrer')}><ExternalLink size={17}/>Open route</button>
    </div>}
    <button className="primary full" onClick={onDone}>Back to today</button>
  </div>;
}
