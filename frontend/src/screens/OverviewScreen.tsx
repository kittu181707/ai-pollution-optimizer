import { ArrowRight, CalendarCheck, Check, Clock3, Sun, ThermometerSun } from 'lucide-react';
import type { DayAnalysis } from '../types';
import { Brand } from '../components/Brand';

function percentDown(before: number, after: number) {
  return before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
}
function count(value: number) {
  return value >= Number.MAX_SAFE_INTEGER ? 'Very large' : new Intl.NumberFormat().format(value);
}
export function OverviewScreen({ analysis, onChanges, onKeep }: { analysis: DayAnalysis; onChanges: () => void; onKeep: () => void }) {
  const metrics = analysis.metrics;
  const uvReduction = percentDown(metrics.originalHighUvMinutes, metrics.optimizedHighUvMinutes);
  const heatReduction = percentDown(metrics.originalHeatRiskMinutes, metrics.optimizedHeatRiskMinutes);
  return <div className="screen wide result-screen">
    <div className="result-top"><Brand/><div className="status-pill"><Check size={15}/>Appointments kept</div></div>
    <section className="result-hero">
      <div className="eyebrow">TODAY</div>
      <div className="result-primary"><strong>−{metrics.exposureReductionPct}%</strong><span>modeled exposure</span></div>
      <div className="score-shift" aria-label="Exposure index change"><span>100</span><ArrowRight size={17}/><strong>{metrics.optimizedExposureIndex}</strong></div>
    </section>
    <div className="metric-strip">
      <div><CalendarCheck size={18}/><span>Appointments</span><strong>{metrics.appointmentsChanged === 0 ? 'No changes' : metrics.appointmentsChanged}</strong></div>
      <div><Clock3 size={18}/><span>Extra travel</span><strong>{'+' + metrics.extraTravelMinutes + ' min'}</strong></div>
      <div><Sun size={18}/><span>High UV</span><strong>{uvReduction ? '−' + uvReduction + '%' : 'No increase'}</strong></div>
      <div><ThermometerSun size={18}/><span>Heat exposure</span><strong>{heatReduction ? '−' + heatReduction + '%' : 'No increase'}</strong></div>
    </div>
    {analysis.changes.length > 0 ? <button className="primary cta result-cta" onClick={onChanges}>
      {'Review ' + analysis.changes.length + ' change' + (analysis.changes.length === 1 ? '' : 's')}<ArrowRight size={18}/>
    </button> : <div className="no-change-card"><Check size={20}/><div><strong>Your current day is already the best feasible plan.</strong><span>No useful change cleared the threshold.</span></div></div>}
    <button className="quiet-action" onClick={onKeep}>{analysis.changes.length ? 'Keep current day' : 'Start over'}</button>
    <details className="tech-details">
      <summary>Analysis details</summary>
      <dl>
        <div><dt>Routes checked</dt><dd>{count(analysis.workflow.routesEvaluated)}</dd></div>
        <div><dt>Plans considered</dt><dd>{count(analysis.workflow.dayPlansTested)}</dd></div>
        <div><dt>Feasible plans</dt><dd>{count(analysis.workflow.feasiblePlans)}</dd></div>
      </dl>
      <div className="source-line">{analysis.workflow.routeSource}</div>
      <div className="source-line">{analysis.workflow.environmentSource}</div>
    </details>
  </div>;
}
