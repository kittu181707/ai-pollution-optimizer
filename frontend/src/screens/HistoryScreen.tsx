import { History, RefreshCw } from 'lucide-react';
import type { AcceptedPlan } from '../types';

export function HistoryScreen({ plans, loading, error, onRefresh }: {
  plans: AcceptedPlan[]; loading: boolean; error?: string; onRefresh: () => void;
}) {
  return <div className="screen wide with-nav">
    <div className="result-top"><div><div className="eyebrow">HISTORY</div><h1 className="page-heading">Saved plans</h1></div><button className="icon-button" aria-label="Refresh history" disabled={loading} onClick={onRefresh}><RefreshCw size={18} className={loading ? 'spin' : ''}/></button></div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {!plans.length ? <div className="empty-state"><History size={28}/><strong>No saved plans yet</strong><span>Accepted plans show up here.</span></div> :
      <div className="history-grid">{plans.map((plan) => <article className="history-card" key={plan.planId}>
        <div className="history-date">{plan.date}</div>
        <strong>{'−' + plan.metrics.exposureReductionPct + '%'}</strong>
        <div className="history-meta"><span>{'+' + plan.metrics.extraTravelMinutes + ' min'}</span><span>{plan.changes.length + ' change' + (plan.changes.length === 1 ? '' : 's')}</span></div>
      </article>)}</div>}
  </div>;
}
