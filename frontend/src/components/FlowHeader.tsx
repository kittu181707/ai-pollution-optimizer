import { ArrowLeft } from 'lucide-react';
import { Brand } from './Brand';

export function FlowHeader({ step, onBack }: { step: 1 | 2 | 3; onBack?: () => void }) {
  const labels = ['Day', 'Travel', 'Result'];
  return <header className="flow-header">
    <div className="flow-top">
      <Brand />
      {onBack && <button className="back compact" onClick={onBack}><ArrowLeft size={17}/>Back</button>}
    </div>
    <div className="step-track" aria-label={`Step ${step} of 3`}>
      {labels.map((label, index) => {
        const value = index + 1;
        return <div key={label} className={value === step ? 'step active' : value < step ? 'step done' : 'step'}>
          <span>{value}</span><strong>{label}</strong>
        </div>;
      })}
    </div>
  </header>;
}
