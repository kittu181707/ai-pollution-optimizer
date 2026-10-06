import { ArrowRight, CalendarPlus, FileUp, Sparkles } from 'lucide-react';
import { Brand } from '../components/Brand';

export function LandingScreen({ onImport, onManual, onDemo, busy }: { onImport: () => void; onManual: () => void; onDemo: () => void; busy: boolean }) {
  return <div className="landing screen narrow">
    <Brand/>
    <div className="landing-copy"><p className="eyebrow">AI PERSONAL POLLUTION OPTIMIZER</p><h1>Your day is already planned.<br/>We make the journey better.</h1><p>Understands your existing appointments, analyzes real environmental conditions around every trip, and finds the smallest changes to your route or transport to reduce your exposure.</p></div>
    <div className="stack actions">
      <button className="primary large" onClick={onImport}><FileUp/>Import today's calendar<ArrowRight/></button>
      <button className="secondary large" onClick={onManual}><CalendarPlus/>Add today manually</button>
      <button className="text-button" disabled={busy} onClick={onDemo}><Sparkles/>{busy ? 'Loading demo…' : 'Try Demo Day'}</button>
    </div>
    <p className="signal-row">Air Quality <span/> Heat Risk <span/> UV Index <span/> Live Weather <span/> Traffic Conditions</p>
    <p className="bottom-line">Make every journey healthier, without changing your day.</p>
  </div>;
}
