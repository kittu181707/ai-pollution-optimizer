import { ArrowRight, CalendarPlus, FileUp, Play } from 'lucide-react';
import { Brand } from '../components/Brand';

export function LandingScreen({ onImport, onManual, onDemo, busy, error }: {
  onImport: () => void;
  onManual: () => void;
  onDemo: () => void;
  busy: boolean;
  error?: string;
}) {
  return <div className="landing screen narrow">
    <Brand/>
    <div className="landing-copy">
      <div className="eyebrow">TODAY, WITH LESS EXPOSURE</div>
      <h1>Plan the day you already have.</h1>
      <div className="hero-line">Same appointments. Better route and timing choices.</div>
    </div>

    <div className="quick-signals" aria-label="Environmental factors">
      <span>Pollution</span><span>Heat</span><span>UV</span><span>Weather</span>
    </div>

    {error && <div className="error-banner" role="alert">{error}</div>}

    <div className="choice-stack">
      <button className="primary action-card" onClick={onImport}>
        <span className="action-icon"><FileUp size={20}/></span>
        <span><strong>Import calendar</strong><small>.ics file</small></span>
        <ArrowRight size={19}/>
      </button>
      <button className="secondary action-card" onClick={onManual}>
        <span className="action-icon"><CalendarPlus size={20}/></span>
        <span><strong>Enter my day</strong><small>Add events manually</small></span>
        <ArrowRight size={19}/>
      </button>
    </div>

    <button className="demo-link" disabled={busy} onClick={onDemo}>
      <Play size={15}/>{busy ? 'Loading demo' : 'Try a 30-second demo'}
    </button>
  </div>;
}
