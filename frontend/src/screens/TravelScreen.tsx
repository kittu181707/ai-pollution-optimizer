import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { JourneyInput, TransportMode } from '../types';
import { modes, shortTime } from '../utils';

export function TravelScreen({ journeys, setJourneys, maxExtra, setMaxExtra, onBack, onAnalyze }: {
  journeys: JourneyInput[]; setJourneys: (value: JourneyInput[]) => void; maxExtra: number; setMaxExtra: (value: number) => void; onBack: () => void; onAnalyze: () => void;
}) {
  const update = (id: string, patch: Partial<JourneyInput>) => setJourneys(journeys.map((j) => j.tripId === id ? { ...j, ...patch } : j));
  return <div className="screen wide">
    <button className="back" onClick={onBack}><ArrowLeft/>Back</button>
    <div className="screen-title"><p className="eyebrow">CONFIRM TRAVEL</p><h1>How will you travel?</h1><p>Confirm your usual mode and planned departure for each journey.</p></div>
    <div className="journey-list">{journeys.map((journey, index) => <article className="journey-card" key={journey.tripId}>
      <div className="journey-head"><span>Journey {index + 1}</span><strong>{shortTime(journey.departureTime)}{journey.arriveBy ? ` → by ${shortTime(journey.arriveBy)}` : ''}</strong></div>
      <div className="route-pair"><strong>{journey.origin}</strong><ArrowRight/><strong>{journey.destination}</strong></div>
      <label>Planned departure<input type="time" value={journey.departureTime} onChange={(e) => update(journey.tripId, { departureTime: e.target.value })}/></label>
      <div><span className="field-label">Usual mode</span><div className="mode-grid">{modes.map((mode) => <button className={journey.mode === mode.value ? 'selected' : ''} key={mode.value} onClick={() => update(journey.tripId, { mode: mode.value as TransportMode })}>{mode.label}</button>)}</div></div>
    </article>)}</div>
    <article className="preference-card"><div><p className="eyebrow">ONE PREFERENCE</p><h2>Maximum extra travel today</h2></div><div className="segmented">{[0,5,10,15].map((v) => <button key={v} className={maxExtra === v ? 'selected' : ''} onClick={() => setMaxExtra(v)}>{v ? `+${v}` : '0'} min</button>)}</div></article>
    <div className="sticky-actions"><button className="primary" onClick={onAnalyze}>Analyze my day</button></div>
  </div>;
}
