import { History } from 'lucide-react';
import type { AcceptedPlan } from '../types';

export function HistoryScreen({ plans, loading, onRefresh }: { plans: AcceptedPlan[]; loading: boolean; onRefresh: () => void }) {
  return <div className="screen wide with-nav"><div className="screen-title"><p className="eyebrow">HISTORY</p><h1>Accepted plans</h1></div>{!plans.length ? <div className="empty"><History/><h2>No accepted plans yet</h2><p>Your saved whole-day plans will appear here.</p><button className="secondary" onClick={onRefresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button></div> : <div className="history-grid">{plans.map((plan) => <article className="history-card" key={plan.planId}><span>{plan.date}</span><strong>-{plan.metrics.exposureReductionPct}% modeled exposure</strong><p>+{plan.metrics.extraTravelMinutes} min · {plan.changes.length} change(s)</p></article>)}</div>}</div>;
}
