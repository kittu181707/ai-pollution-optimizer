import { ArrowRight, CalendarCheck, Check, Clock3, HelpCircle, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DayAnalysis, TripAnalysis } from '../types';
import { EnvironmentalSnapshot } from '../components/EnvironmentalSnapshot';
import { ModeIcon } from '../components/ModeIcon';
import { RoutePreview } from '../components/RoutePreview';
import { shortTime } from '../utils';

function reductionPct(trip: TripAnalysis) {
  if (trip.original.pollutionExposure <= 0) return 0;
  return Math.max(0, Math.round((1 - trip.recommended.pollutionExposure / trip.original.pollutionExposure) * 100));
}

function formatDate(value: string) {
  const date = new Date(value + 'T12:00:00');
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(date);
}

function runtime(ms: number) {
  return ms > 0 ? Math.max(.1, ms / 1000).toFixed(1) + 's' : '—';
}

export function OverviewScreen({ analysis, onWhy, onPlan, onReset }: {
  analysis: DayAnalysis;
  onWhy: (trip: TripAnalysis) => void;
  onPlan: () => void;
  onReset: () => void;
}) {
  const dominant = useMemo(() => {
    const changed = [...analysis.changes].sort((a, b) =>
      (b.original.pollutionExposure - b.recommended.pollutionExposure)
      - (a.original.pollutionExposure - a.recommended.pollutionExposure)
    );
    return changed[0] || analysis.trips[0];
  }, [analysis]);

  const [selectedId, setSelectedId] = useState(dominant?.tripId || '');
  const selected = analysis.trips.find((trip) => trip.tripId === selectedId) || dominant;
  const metrics = analysis.metrics;

  return <div className="screen dashboard-screen">
    <header className="dashboard-header">
      <div>
        <span className="section-kicker">Today</span>
        <h1>{formatDate(analysis.date)}</h1>
      </div>
      <button className="quiet-action dashboard-reset" onClick={onReset}>New day</button>
    </header>

    <section className="decision-summary" aria-label="Optimization result">
      <div className="decision-primary">
        <span>Modeled pollution exposure</span>
        <strong>−{metrics.pollutionReductionPct}%</strong>
        <small>100 → {metrics.optimizedExposureIndex}</small>
      </div>
      <div className="decision-stat">
        <CalendarCheck size={18}/>
        <strong>{metrics.appointmentsChanged}</strong>
        <span>appointments moved</span>
      </div>
      <div className="decision-stat">
        <Clock3 size={18}/>
        <strong>+{metrics.extraTravelMinutes}</strong>
        <span>minutes today</span>
      </div>
      <div className="decision-stat">
        <Sparkles size={18}/>
        <strong>{analysis.changes.length}</strong>
        <span>useful change{analysis.changes.length === 1 ? '' : 's'}</span>
      </div>
    </section>

    <div className="dashboard-grid">
      <section className="dashboard-card journeys-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">Schedule</span>
            <h2>Today's journeys</h2>
          </div>
          <span className="card-count">{analysis.trips.length}</span>
        </div>

        <div className="journey-timeline">
          {analysis.trips.map((trip) => {
            const active = selected?.tripId === trip.tripId;
            return <button
              key={trip.tripId}
              className={'journey-row' + (active ? ' active' : '')}
              onClick={() => setSelectedId(trip.tripId)}
              aria-pressed={active}
            >
              <span className={'journey-dot' + (trip.changed ? ' changed' : '')}/>
              <span className="journey-time">{shortTime(trip.recommended.departureTime)}</span>
              <span className="journey-copy">
                <strong>{trip.origin} → {trip.destination}</strong>
                <small><ModeIcon mode={trip.recommended.mode} size={13}/>{trip.recommended.label} · {trip.recommended.travelMinutes} min</small>
              </span>
              <span className={trip.changed ? 'journey-state changed' : 'journey-state'}>
                {trip.changed ? 'Changed' : <Check size={14}/>}
              </span>
            </button>;
          })}
        </div>
      </section>

      {selected && <section className="dashboard-card focus-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">{selected.changed ? 'Best change' : 'Journey'}</span>
            <h2>{selected.origin} → {selected.destination}</h2>
          </div>
          {selected.changed && <span className="reduction-pill">−{reductionPct(selected)}%</span>}
        </div>

        <div className="route-choice">
          <div>
            <span>Current</span>
            <strong><ModeIcon mode={selected.original.mode} size={16}/>{selected.original.label}</strong>
            <small>{selected.original.travelMinutes} min · exposure {selected.original.pollutionExposure.toFixed(0)}</small>
          </div>
          <ArrowRight size={17}/>
          <div className={selected.changed ? 'recommended' : ''}>
            <span>{selected.changed ? 'Recommended' : 'Best feasible'}</span>
            <strong><ModeIcon mode={selected.recommended.mode} size={16}/>{selected.recommended.label}</strong>
            <small>{selected.recommended.travelMinutes} min · exposure {selected.recommended.pollutionExposure.toFixed(0)}</small>
          </div>
        </div>

        <RoutePreview planId={analysis.planId} trip={selected}/>

        {selected.changed && <div className="focus-actions">
          <button className="secondary" onClick={() => onWhy(selected)}><HelpCircle size={16}/>Why this change?</button>
          <button className="primary" onClick={onPlan}>Review plan<ArrowRight size={16}/></button>
        </div>}
        {!selected.changed && <div className="kept-note"><Check size={16}/>No useful change beats your current trip.</div>}
      </section>}
    </div>

    <div className="dashboard-lower">
      <EnvironmentalSnapshot analysis={analysis}/>

      <section className="dashboard-card proof-card" aria-label="Analysis execution">
        <div className="card-heading compact">
          <div>
            <span className="section-kicker">Analysis</span>
            <h2>What the engine checked</h2>
          </div>
        </div>
        <div className="proof-grid">
          <div><strong>{analysis.workflow.routesEvaluated}</strong><span>routes</span></div>
          <div><strong>{analysis.workflow.dayPlansTested >= Number.MAX_SAFE_INTEGER ? '9Q+' : analysis.workflow.dayPlansTested.toLocaleString()}</strong><span>day plans</span></div>
          <div><strong>{analysis.workflow.environmentalSamples}</strong><span>samples</span></div>
          <div><strong>{runtime(analysis.workflow.analysisDurationMs)}</strong><span>runtime</span></div>
        </div>
        <details className="proof-sources">
          <summary>Data sources</summary>
          <span>{analysis.workflow.routeSource}</span>
          <span>{analysis.workflow.environmentSource}</span>
        </details>
      </section>
    </div>

    {!analysis.changes.length && <button className="primary dashboard-plan-button" onClick={onPlan}>View today's plan<ArrowRight size={16}/></button>}
  </div>;
}
