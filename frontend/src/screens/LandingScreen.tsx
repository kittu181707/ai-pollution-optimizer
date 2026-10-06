import { ArrowRight, CalendarPlus, FileUp, Sparkles } from 'lucide-react';
import { Brand } from '../components/Brand';

export function LandingScreen({ onImport, onManual, onDemo, busy }: { onImport: () => void; onManual: () => void; onDemo: () => void; busy: boolean }) {
  return <div className="landing screen narrow">
    <Brand/>
    <div className="landing-copy"><p className="eyebrow">PERSONAL ENVIRONMENTAL EXPOSURE</p><h1>Your day is already planned.<br/>We make it lower exposure.</h1><p>Find smaller changes that reduce pollution, heat, UV and weather exposure without moving fixed appointments.</p></div>
    <div className="stack actions">
      <button className="primary large" onClick={onImport}><FileUp/>Import today's calendar<ArrowRight/></button>
      <button className="secondary large" onClick={onManual}><CalendarPlus/>Add today manually</button>
      <button className="text-button" disabled={busy} onClick={onDemo}><Sparkles/>{busy ? 'Loading demo…' : 'Load demo day'}</button>
    </div>
    <p className="signal-row">Pollution <span/> Heat <span/> UV <span/> Weather</p>
    <p className="bottom-line">Same appointments. Less modeled exposure.</p>
  </div>;
}
