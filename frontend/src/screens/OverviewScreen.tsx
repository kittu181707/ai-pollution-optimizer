import { ArrowDown, ArrowRight, CalendarCheck, Clock3, Sun, ThermometerSun } from 'lucide-react';
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
    <div className="result-top">
      <Brand/>
      <div className="status-pill"><CalendarCheck size={15}/>Appointments kept</div>
    </div>

    <div className="screen-title result-title">
      <div className="eyebrow">WHOLE DAY OPTIMIZED</div>
      <h1>Less exposure. Same day.</h1>
      <div className="screen-hint">{analysis.changes.length ? analysis.changes.length + ' focused change' + (analysis.changes.length === 1 ? '' : 's') : 'No useful change needed'}</div>
    </div>

    <section className="exposure-hero" aria-label="Modeled pollution exposure index">
      <div className="exposure-side">
        <span>Original</span>
        <strong>100</strong>
      </div>
      <ArrowRight className="exposure-arrow" size={24}/>
      <div className="exposure-side optimized">
        <span>Optimized</span>
        <strong>{metrics.optimizedExposureIndex}</strong>
      </div>
      <div className="exposure-delta"><ArrowDown size={15}/>{metrics.pollutionReductionPct}% <small>modeled pollution</small></div>
    </section>

    <div className="metric-grid">
      <div><CalendarCheck size={19}/><span>Appointments</span><strong>{metrics.appointmentsChanged === 0 ? 'No changes' : metrics.appointmentsChanged}</strong></div>
      <div><Clock3 size={19}/><span>Extra travel</span><strong>{'+' + metrics.extraTravelMinutes + ' min'}</strong></div>
      <div><Sun size={19}/><span>High UV</span><strong>{uvReduction ? '−' + uvReduction + '%' : 'No increase'}</strong></div>
      <div><ThermometerSun size={19}/><span>Heat exposure</span><strong>{heatReduction ? '−' + heatReduction + '%' : 'No increase'}</strong></div>
    </div>

    <section className="aws-proof">
      <div>
        <div className="eyebrow">AWS OPTIMIZATION</div>
        <h3>Whole-day route search completed</h3>
        <p>Route candidates and environmental samples were ranked under your appointment and time constraints.</p>
      </div>
      <dl>
        <div><dt>Routes</dt><dd>{count(analysis.workflow.routesEvaluated)}</dd></div>
        <div><dt>Plans</dt><dd>{count(analysis.workflow.dayPlansTested)}</dd></div>
        <div><dt>Samples</dt><dd>{count(analysis.workflow.environmentalSamples)}</dd></div>
      </dl>
    </section>

    {analysis.changes.length > 0 ? <div className="result-actions">
      <button className="primary cta" onClick={onChanges}>See what changed<ArrowRight size={18}/></button>
      <button className="secondary" onClick={onKeep}>Keep current day</button>
    </div> : <>
      <div className="no-change-card"><CalendarCheck size={20}/><div><strong>Your current day is already the best feasible plan.</strong><span>No useful pollution reduction cleared the threshold.</span></div></div>
      <button className="quiet-action" onClick={onKeep}>Start over</button>
    </>}

    <details className="tech-details">
      <summary>Data sources</summary>
      <div className="source-line">{analysis.workflow.routeSource}</div>
      <div className="source-line">{analysis.workflow.environmentSource}</div>
    </details>
  </div>;
}
