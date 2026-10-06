import { Check, LoaderCircle } from 'lucide-react';

export function AnalysisScreen({ error, onBack }: { error?: string; onBack: () => void }) {
  const steps = ['Agenda received', 'Journeys validated', 'Route alternatives requested', 'Pollution + weather timeline checked', 'Constraints applied'];
  return <div className="screen narrow analysis-screen"><p className="eyebrow">AWS OPTIMIZATION</p><h1>Analyzing your day</h1>
    {!error ? <div className="progress-card">{steps.map((step) => <div className="progress-row" key={step}><Check/> <span>{step}</span></div>)}<div className="progress-row active"><LoaderCircle className="spin"/><strong>Finding the best whole-day plan…</strong></div></div> : <div className="error-banner"><strong>Analysis stopped.</strong><br/>{error}<div><button className="secondary" onClick={onBack}>Return to travel setup</button></div></div>}
    <p className="fine-print">No client-side optimizer is running. This screen waits for the AWS-backed analysis response.</p>
  </div>;
}
