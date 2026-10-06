import { Cloud, Route, ShieldCheck } from 'lucide-react';
import { FlowHeader } from '../components/FlowHeader';

export function AnalysisScreen({ error, onBack }: { error?: string; onBack: () => void }) {
  return <div className="screen narrow">
    <FlowHeader step={3} onBack={error ? onBack : undefined}/>
    <div className="analysis-screen">
      {!error ? <>
        <div className="analysis-mark" aria-hidden="true"><span/><span/><span/></div>
        <div className="eyebrow">CHECKING YOUR DAY</div>
        <h1>Finding the smallest useful changes</h1>
        <div className="analysis-tags">
          <span><Route size={16}/>Routes</span>
          <span><Cloud size={16}/>Environment</span>
          <span><ShieldCheck size={16}/>Constraints</span>
        </div>
        <div className="fine-print">AWS-backed analysis · no client-side scoring</div>
      </> : <div className="analysis-error">
        <div className="error-symbol">!</div>
        <h1>Couldn’t finish the analysis</h1>
        <div className="error-banner" role="alert">{error}</div>
        <button className="secondary" onClick={onBack}>Review travel setup</button>
      </div>}
    </div>
  </div>;
}
