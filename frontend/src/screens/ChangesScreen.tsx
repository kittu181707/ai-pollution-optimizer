import { ArrowLeft, ArrowRight, Clock3, HelpCircle, Sparkles } from 'lucide-react';
import type { DayAnalysis, TripAnalysis } from '../types';
import { RoutePreview } from '../components/RoutePreview';
import { ModeIcon } from '../components/ModeIcon';
import { shortTime } from '../utils';

function reduction(trip: TripAnalysis) {
  return Math.max(0, Math.round((1 - trip.recommended.modeledExposure / Math.max(0.01, trip.original.modeledExposure)) * 100));
}
export function ChangesScreen({ analysis, onBack, onWhy, onFinal }: {
  analysis: DayAnalysis; onBack: () => void; onWhy: (trip: TripAnalysis) => void; onFinal: () => void;
}) {
  return <div className="screen wide">
    <div className="subnav"><button className="back compact" onClick={onBack}><ArrowLeft size={17}/>Result</button><span>{analysis.changes.length + ' change' + (analysis.changes.length === 1 ? '' : 's')}</span></div>
    <div className="screen-title compact-title"><div className="eyebrow">WHAT CHANGED</div><h1>Small moves. Clear impact.</h1></div>
    {!analysis.changes.length && <div className="no-change-card large"><Sparkles size={22}/><div><strong>Nothing worth changing.</strong><span>Your current plan stays intact.</span></div></div>}
    <div className="change-list">
      {analysis.changes.map((trip, index) => {
        const extra = trip.recommended.travelMinutes - trip.original.travelMinutes;
        return <article className="change-card" key={trip.tripId}>
          <div className="change-heading">
            <div><span>{'CHANGE ' + String(index + 1).padStart(2, '0')}</span><h2>{trip.origin} <ArrowRight size={15}/> {trip.destination}</h2></div>
            <div className="impact-badge">{'−' + reduction(trip) + '%'}</div>
          </div>
          <div className="trip-swap">
            <div className="trip-option current">
              <span className="option-kicker">Current</span>
              <div className="mode-title"><ModeIcon mode={trip.original.mode}/><strong>{trip.original.label}</strong></div>
              <div className="option-meta"><span>{shortTime(trip.original.departureTime)}</span><span>{trip.original.travelMinutes + ' min'}</span><span>{'Score ' + trip.original.modeledExposure.toFixed(0)}</span></div>
            </div>
            <ArrowRight className="swap-arrow" size={18}/>
            <div className="trip-option recommended">
              <span className="option-kicker">Use</span>
              <div className="mode-title"><ModeIcon mode={trip.recommended.mode}/><strong>{trip.recommended.label}</strong></div>
              <div className="option-meta"><span>{shortTime(trip.recommended.departureTime)}</span><span>{trip.recommended.travelMinutes + ' min'}</span><span>{'Score ' + trip.recommended.modeledExposure.toFixed(0)}</span></div>
            </div>
          </div>
          <div className="change-footer">
            <span><Clock3 size={15}/>{(extra >= 0 ? '+' : '') + extra + ' min'}</span>
            <button className="why-button" onClick={() => onWhy(trip)}><HelpCircle size={16}/>Why this?</button>
          </div>
          <RoutePreview trip={trip}/>
        </article>;
      })}
    </div>
    <div className="sticky-actions solid"><button className="primary cta" onClick={onFinal}>Review final plan<ArrowRight size={18}/></button></div>
  </div>;
}
