import { ArrowRight, Clock3 } from 'lucide-react';
import type { JourneyInput, TransportMode } from '../types';
import { FlowHeader } from '../components/FlowHeader';
import { ModeIcon } from '../components/ModeIcon';
import { modes, shortTime } from '../utils';

export function TravelScreen({ journeys, setJourneys, maxExtra, setMaxExtra, onBack, onAnalyze, isDemo }: {
  journeys: JourneyInput[];
  setJourneys: (value: JourneyInput[]) => void;
  maxExtra: number;
  setMaxExtra: (value: number) => void;
  onBack: () => void;
  onAnalyze: () => void;
  isDemo: boolean;
}) {
  const update = (id: string, patch: Partial<JourneyInput>) =>
    setJourneys(journeys.map((journey) => journey.tripId === id ? { ...journey, ...patch } : journey));

  return <div className="screen wide">
    <FlowHeader step={2} onBack={onBack}/>

    <div className="screen-title compact-title">
      <div className="eyebrow">TRAVEL</div>
      <h1>Confirm how you move</h1>
      <div className="screen-hint">{journeys.length} journey{journeys.length === 1 ? '' : 's'}</div>
    </div>

    {!journeys.length && <div className="no-change-card large">
      <div><strong>No travel between appointments.</strong><span>There is nothing to optimize because all locations are the same.</span></div>
    </div>}

    <div className="journey-list">
      {journeys.map((journey, index) => <article className="journey-card" key={journey.tripId}>
        <div className="journey-top">
          <span className="journey-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="arrival-chip"><Clock3 size={14}/>{shortTime(journey.departureTime)}{journey.arriveBy ? ' → ' + shortTime(journey.arriveBy) : ''}</span>
        </div>

        <div className="route-pair">
          <strong>{journey.origin}</strong><ArrowRight size={17}/><strong>{journey.destination}</strong>
        </div>

        <div className="journey-controls">
          <label className="departure-field"><span>Leave</span><input type="time" value={journey.departureTime} onChange={(e) => update(journey.tripId, { departureTime: e.target.value })}/></label>
          <div className="mode-block">
            <span className="field-label">Usual mode</span>
            <div className="mode-grid">
              {modes.map((mode) => {
                const unavailable = mode.value === 'bike' && !isDemo;
                return <button
                  aria-pressed={journey.mode === mode.value}
                  className={journey.mode === mode.value ? 'selected' : ''}
                  disabled={unavailable}
                  title={unavailable ? 'Live bicycle routing is not available from the configured route provider' : undefined}
                  key={mode.value}
                  onClick={() => update(journey.tripId, { mode: mode.value as TransportMode })}
                ><ModeIcon mode={mode.value}/><span>{mode.label}</span></button>;
              })}
            </div>
            {!isDemo && <span className="fine-print">Bike is disabled in live mode because the configured AWS route provider cannot verify bicycle routes in this region.</span>}
          </div>
        </div>
      </article>)}
    </div>

    <section className="budget-card">
      <div><span className="field-label">Extra travel allowed</span><strong>{maxExtra ? '+' + maxExtra + ' min' : 'No extra time'}</strong></div>
      <div className="segmented" aria-label="Maximum extra travel">
        {[0, 5, 10, 15].map((value) => <button
          aria-pressed={maxExtra === value}
          key={value}
          className={maxExtra === value ? 'selected' : ''}
          onClick={() => setMaxExtra(value)}
        >{value ? '+' + value : '0'}</button>)}
      </div>
    </section>

    <div className="sticky-actions solid">
      <button className="primary cta" disabled={!journeys.length} onClick={onAnalyze}>
        {journeys.length ? 'Check my day' : 'Nothing to optimize'}<ArrowRight size={18}/>
      </button>
    </div>
  </div>;
}
