import { Check, Route, Sparkles } from 'lucide-react';
import type { DayAnalysis } from '../types';
import { RoutePreview } from './RoutePreview';
import { ModeIcon } from './ModeIcon';
import { shortTime } from '../utils';

export function DayRoutePanel({ analysis }: { analysis: DayAnalysis }) {
  const focusTrip = [...analysis.trips].sort((a, b) =>
    (b.original.pollutionExposure - b.recommended.pollutionExposure)
    - (a.original.pollutionExposure - a.recommended.pollutionExposure)
  )[0];

  if (!focusTrip) return null;

  return <aside className="day-route-panel" aria-label="Whole-day route overview">
    <div className="day-route-panel-head">
      <div>
        <div className="eyebrow">DAY ROUTE VIEW</div>
        <h2>{analysis.changes.length ? 'Where the day improves' : 'Your current day'}</h2>
      </div>
      <div className="aws-map-chip"><Route size={14}/>AWS map</div>
    </div>

    <div className="focus-route">
      <div className="focus-route-kicker">
        {focusTrip.changed ? <><Sparkles size={14}/>Largest avoidable exposure</> : <><Check size={14}/>Best feasible route</>}
      </div>
      <strong>{focusTrip.origin} → {focusTrip.destination}</strong>
    </div>

    <RoutePreview planId={analysis.planId} trip={focusTrip}/>

    <div className="day-route-list" aria-label="Trips in optimized day">
      {analysis.trips.map((trip, index) => <div className="day-route-row" key={trip.tripId}>
        <span className="day-route-number">{String(index + 1).padStart(2, '0')}</span>
        <div>
          <strong>{trip.origin} → {trip.destination}</strong>
          <span>{shortTime(trip.recommended.departureTime)} · <ModeIcon mode={trip.recommended.mode} size={13}/>{trip.recommended.label}</span>
        </div>
        <span className={trip.changed ? 'day-route-state changed' : 'day-route-state'}>{trip.changed ? 'Changed' : 'Kept'}</span>
      </div>)}
    </div>
  </aside>;
}
