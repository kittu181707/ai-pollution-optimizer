import { ArrowRight, Check, Clock3, HelpCircle, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
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
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}

function runtime(ms: number) {
  return ms > 0 ? Math.max(.1, ms / 1000).toFixed(1) + 's' : '—';
}

function travelDelta(trip: TripAnalysis) {
  return trip.recommended.travelMinutes - trip.original.travelMinutes;
}

function travelDeltaLabel(trip: TripAnalysis) {
  const delta = travelDelta(trip);
  if (delta === 0) return 'Same travel time';
  return delta > 0 ? '+' + delta + ' min' : Math.abs(delta) + ' min faster';
}

function co2DeltaLabel(trip: TripAnalysis) {
  const delta = trip.recommended.estimatedCo2eKg - trip.original.estimatedCo2eKg;
  if (Math.abs(delta) < .05) return 'Similar CO₂e';
  return delta < 0 ? Math.abs(delta).toFixed(1) + ' kg less CO₂e' : delta.toFixed(1) + ' kg more CO₂e';
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

  if (!selected) {
    return <div className="screen dashboard-screen">
      <header className="product-header">
        <div>
          <span className="section-kicker">{formatDate(analysis.date)}</span>
          <h1>No journeys today.</h1>
        </div>
        <button className="quiet-action dashboard-reset" onClick={onReset}>New day</button>
      </header>
    </div>;
  }

  const selectedReduction = reductionPct(selected);
  const selectedTravelDelta = travelDelta(selected);
  const dayCo2 = metrics.estimatedCo2eChangeKg;
  const dayCo2Label = Math.abs(dayCo2) < .05
    ? 'No material change'
    : dayCo2 < 0
      ? Math.abs(dayCo2).toFixed(1) + ' kg less'
      : '+' + dayCo2.toFixed(1) + ' kg';

  return <div className="screen dashboard-screen">
    <header className="product-header">
      <div className="product-header-copy">
        <span className="section-kicker">{formatDate(analysis.date)}</span>
        <h1>Your day, optimized.</h1>
        <div className="product-header-meta">
          <span>{analysis.trips.length} journey{analysis.trips.length === 1 ? '' : 's'}</span>
          <i/>
          <span>{analysis.changes.length} useful change{analysis.changes.length === 1 ? '' : 's'}</span>
          <i/>
          <span>{metrics.appointmentsChanged} appointments moved</span>
        </div>
      </div>
      <button className="quiet-action dashboard-reset" onClick={onReset}>New day</button>
    </header>

    <EnvironmentalSnapshot analysis={analysis}/>

    <div className="dashboard-hero-grid">
      <section className="dashboard-card journey-board" aria-label="Today's journeys">
        <div className="board-heading">
          <div>
            <span className="section-kicker">Schedule</span>
            <h2>Today's journeys</h2>
          </div>
          <button className="board-action" onClick={onPlan}>Review plan<ArrowRight size={15}/></button>
        </div>

        <div className="journey-board-list">
          {analysis.trips.map((trip) => {
            const active = selected.tripId === trip.tripId;
            const reduction = reductionPct(trip);
            return <button
              key={trip.tripId}
              className={'journey-board-row' + (active ? ' active' : '')}
              onClick={() => setSelectedId(trip.tripId)}
              aria-pressed={active}
            >
              <span className={'journey-board-dot' + (trip.changed ? ' changed' : '')}/>
              <span className="journey-board-time">{shortTime(trip.recommended.departureTime)}</span>
              <span className="journey-board-copy">
                <strong>{trip.origin} → {trip.destination}</strong>
                <small><ModeIcon mode={trip.recommended.mode} size={14}/>{trip.recommended.label} · {trip.recommended.travelMinutes} min · {trip.recommended.distanceKm.toFixed(1)} km</small>
              </span>
              {trip.changed
                ? <span className="journey-exposure-chip">−{reduction}%</span>
                : <span className="journey-kept"><Check size={14}/></span>}
            </button>;
          })}
        </div>
      </section>

      <section className="dashboard-card map-board" aria-label="Selected journey route">
        <div className="board-heading map-heading">
          <div>
            <span className="section-kicker">Selected journey</span>
            <h2>{selected.origin} → {selected.destination}</h2>
          </div>
          {selected.changed
            ? <span className="map-outcome"><Sparkles size={14}/>−{selectedReduction}% exposure</span>
            : <span className="map-outcome kept"><Check size={14}/>Current route kept</span>}
        </div>
        <div className="map-board-preview">
          <RoutePreview planId={analysis.planId} trip={selected}/>
        </div>
      </section>
    </div>

    <div className="dashboard-detail-grid">
      <section className="dashboard-card journey-analysis" aria-label="Journey analysis">
        <div className="board-heading">
          <div>
            <span className="section-kicker">Journey analysis</span>
            <h2>{shortTime(selected.recommended.departureTime)} · {selected.origin} → {selected.destination}</h2>
          </div>
          <span className={selected.changed ? 'analysis-status recommended' : 'analysis-status'}>{selected.changed ? 'Recommended' : 'Best feasible'}</span>
        </div>

        <div className="route-analysis-compare">
          <article className="route-analysis-option">
            <span className="option-label">Current</span>
            <strong className="option-mode"><ModeIcon mode={selected.original.mode} size={18}/>{selected.original.label}</strong>
            <dl>
              <div><dt>Travel</dt><dd>{selected.original.travelMinutes} min</dd></div>
              <div><dt>Distance</dt><dd>{selected.original.distanceKm.toFixed(1)} km</dd></div>
              <div><dt>Modeled exposure</dt><dd>{selected.original.pollutionExposure.toFixed(0)}</dd></div>
              <div><dt>Estimated CO₂e</dt><dd>{selected.original.estimatedCo2eKg.toFixed(1)} kg</dd></div>
            </dl>
          </article>

          <div className="analysis-arrow"><ArrowRight size={20}/><span>{travelDeltaLabel(selected)}</span></div>

          <article className={'route-analysis-option' + (selected.changed ? ' recommended' : '')}>
            <div className="option-topline">
              <span className="option-label">{selected.changed ? 'Recommended' : 'Keep'}</span>
              {selected.changed && <span className="option-reduction">−{selectedReduction}%</span>}
            </div>
            <strong className="option-mode"><ModeIcon mode={selected.recommended.mode} size={18}/>{selected.recommended.label}</strong>
            <dl>
              <div><dt>Travel</dt><dd>{selected.recommended.travelMinutes} min</dd></div>
              <div><dt>Distance</dt><dd>{selected.recommended.distanceKm.toFixed(1)} km</dd></div>
              <div><dt>Modeled exposure</dt><dd>{selected.recommended.pollutionExposure.toFixed(0)}</dd></div>
              <div><dt>Estimated CO₂e</dt><dd>{selected.recommended.estimatedCo2eKg.toFixed(1)} kg</dd></div>
            </dl>
          </article>
        </div>
      </section>

      <section className="dashboard-card why-card" aria-label="Why this route">
        <div className="board-heading compact">
          <div>
            <span className="section-kicker">Why this route</span>
            <h2>{selected.changed ? 'Worth the switch.' : 'Keep this trip.'}</h2>
          </div>
        </div>

        <div className="reason-list">
          <div className="reason-row">
            <span className="reason-icon"><Leaf size={17}/></span>
            <span><strong>{selected.changed ? selectedReduction + '% lower modeled exposure' : 'No material exposure win'}</strong><small>{selected.changed ? 'Exposure ' + selected.original.pollutionExposure.toFixed(0) + ' → ' + selected.recommended.pollutionExposure.toFixed(0) : 'Alternatives did not clear the improvement threshold.'}</small></span>
          </div>
          <div className="reason-row">
            <span className="reason-icon"><Clock3 size={17}/></span>
            <span><strong>{travelDeltaLabel(selected)}</strong><small>{selectedTravelDelta > 0 ? 'Still inside your whole-day time budget.' : 'No extra travel is required for this choice.'}</small></span>
          </div>
          <div className="reason-row">
            <span className="reason-icon"><ShieldCheck size={17}/></span>
            <span><strong>Appointments stay fixed</strong><small>{co2DeltaLabel(selected)} on this journey.</small></span>
          </div>
        </div>

        <div className="why-actions">
          <button className="secondary" onClick={() => onWhy(selected)}><HelpCircle size={16}/>Details</button>
          <button className="primary" onClick={onPlan}>Review today's plan<ArrowRight size={16}/></button>
        </div>
      </section>
    </div>

    <section className="dashboard-card daily-impact" aria-label="Daily impact">
      <div className="daily-impact-title">
        <span className="section-kicker">Daily impact</span>
        <strong>Cleaner route choices, same schedule.</strong>
      </div>
      <div className="daily-impact-metrics">
        <div><strong>−{metrics.pollutionReductionPct}%</strong><span>modeled exposure</span></div>
        <div><strong>+{metrics.extraTravelMinutes} min</strong><span>extra travel</span></div>
        <div><strong>{dayCo2Label}</strong><span>estimated CO₂e</span></div>
        <div><strong>{analysis.workflow.routesEvaluated}</strong><span>routes checked</span></div>
      </div>
      <details className="engine-proof">
        <summary>Analysis proof</summary>
        <span>{analysis.workflow.environmentalSamples} route samples · {analysis.workflow.dayPlansTested >= Number.MAX_SAFE_INTEGER ? '9Q+' : analysis.workflow.dayPlansTested.toLocaleString()} day plans · {runtime(analysis.workflow.analysisDurationMs)} runtime</span>
      </details>
    </section>
  </div>;
}
