import { useState } from 'react';
import { Brand } from '../components/Brand';
import type { JourneyInput, TransportMode } from '../types';
import { modes } from '../utils';

export function LandingScreen({ onAnalyze, busy, maxExtra, setMaxExtra }: {
  onAnalyze: (journey: JourneyInput) => void;
  busy: boolean;
  maxExtra: number;
  setMaxExtra: (value: number) => void;
}) {
  const [timeOfDay, setTimeOfDay] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [hour, setHour] = useState<string>('08:00');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<TransportMode>('car');

  const timeSlots = {
    Morning: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'],
    Afternoon: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    Evening: ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
  };

  const handleTimeOfDay = (tod: 'Morning' | 'Afternoon' | 'Evening') => {
    setTimeOfDay(tod);
    setHour(timeSlots[tod][0]);
  };

  const submit = () => {
    if (!origin.trim() || !destination.trim()) return;
    onAnalyze({
      tripId: `trip-${Date.now()}`,
      origin,
      destination,
      departureTime: hour,
      mode,
    });
  };

  return <div className="landing screen narrow">
    <Brand />
    <div className="landing-copy">
      <p className="eyebrow">AI PERSONAL POLLUTION OPTIMIZER</p>
      <h1>Plan your journey.</h1>
      <p>Analyzes real environmental conditions for your trip, and finds the smallest changes to your route or transport to reduce your exposure.</p>
    </div>
    
    <div className="stack actions">
      <article className="journey-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <span className="field-label">Time of day</span>
          <div className="mode-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {(['Morning', 'Afternoon', 'Evening'] as const).map(tod => (
              <button key={tod} className={timeOfDay === tod ? 'selected' : ''} onClick={() => handleTimeOfDay(tod)}>{tod}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span className="field-label">Time slot</span>
          <div className="mode-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {timeSlots[timeOfDay].map(slot => (
              <button key={slot} className={hour === slot ? 'selected' : ''} onClick={() => setHour(slot)}>{slot}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
          <label>Origin<input type="text" placeholder="E.g. Home" value={origin} onChange={e => setOrigin(e.target.value)} /></label>
          <label>Destination<input type="text" placeholder="E.g. Office" value={destination} onChange={e => setDestination(e.target.value)} /></label>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span className="field-label">Transport Mode</span>
          <div className="mode-grid">
            {modes.map((m) => (
              <button key={m.value} className={mode === m.value ? 'selected' : ''} onClick={() => setMode(m.value as TransportMode)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <span className="field-label">Max extra travel (min)</span>
          <div className="segmented">
            {[0, 5, 10, 15].map((v) => (
              <button key={v} className={maxExtra === v ? 'selected' : ''} onClick={() => setMaxExtra(v)}>
                {v ? `+${v}` : '0'} min
              </button>
            ))}
          </div>
        </div>

        <button className="primary large full" disabled={busy || !origin.trim() || !destination.trim() || origin === destination} onClick={submit}>
          {busy ? 'Analyzing...' : 'Analyze my trip'}
        </button>
      </article>
    </div>
  </div>;
}
