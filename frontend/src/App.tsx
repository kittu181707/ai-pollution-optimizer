import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { BottomNav, type NavTab } from './components/BottomNav';
import { Drawer } from './components/Drawer';
import { AcceptedScreen } from './screens/AcceptedScreen';
import { AnalysisScreen } from './screens/AnalysisScreen';
import { ChangesScreen } from './screens/ChangesScreen';
import { FinalPlanScreen } from './screens/FinalPlanScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { LandingScreen } from './screens/LandingScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ImpactScreen } from './screens/ImpactScreen';
import { Map } from './components/Map';
import type { AcceptedPlan, DayAnalysis, JourneyInput, TripAnalysis } from './types';
import { getUserId, localDate, readStoredNumber, storeNumber } from './utils';

type Step = 'landing'|'analysis'|'overview'|'changes'|'final'|'accepted';

export default function App() {
  const [step, setStep] = useState<Step>('landing');
  const [maxExtra, setMaxExtraState] = useState(() => {
    const stored = readStoredNumber('max_extra_minutes', 10);
    return [0, 5, 10, 15].includes(stored) ? stored : 10;
  });
  const [analysis, setAnalysis] = useState<DayAnalysis | null>(null);
  const [accepted, setAccepted] = useState<AcceptedPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [whyTrip, setWhyTrip] = useState<TripAnalysis | null>(null);
  const [whyText, setWhyText] = useState('');
  const [tab, setTab] = useState<NavTab>('today');
  const [history, setHistory] = useState<AcceptedPlan[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const userId = useMemo(() => getUserId(), []);
  const setMaxExtra = (value: number) => { setMaxExtraState(value); storeNumber('max_extra_minutes', value); };

  const runAnalysis = async (journey: JourneyInput) => {
    if (busy) return;
    setStep('analysis'); setError(undefined); setBusy(true);
    try {
      const result = await api.analyzeDay({
        date: localDate(),
        homeLocation: 'Home',
        events: [],
        userId,
        journeys: [journey],
        maxExtraMinutes: maxExtra
      });
      setAnalysis(result); setStep('overview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
      setStep('landing');
    } finally {
      setBusy(false);
    }
  };

  const acceptPlan = async () => {
    if (!analysis || busy) return;
    setBusy(true); setError(undefined);
    try {
      const saved = await api.acceptPlan(userId, analysis.planId);
      setAccepted(saved); setStep('accepted');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save plan');
    } finally {
      setBusy(false);
    }
  };

  const openWhy = async (trip: TripAnalysis) => {
    setWhyTrip(trip); setWhyText(trip.explanation);
    try {
      if (!analysis) return;
      const result = await api.explain(analysis.planId, trip);
      setWhyText(result.explanation);
    } catch { /* verified deterministic explanation remains */ }
  };

  const refreshHistory = async () => {
    setHistoryLoading(true);
    try {
      const result = await api.history(userId);
      setHistory(result.plans);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { if (tab === 'history') void refreshHistory(); }, [tab]);

  const onNav = (next: NavTab) => {
    setTab(next);
    if (next === 'today') setStep(analysis ? 'overview' : 'landing');
    if (next === 'plan') setStep(analysis ? 'final' : 'landing');
  };

  if (tab === 'history') return <><HistoryScreen plans={history} loading={historyLoading} onRefresh={refreshHistory}/><BottomNav active={tab} onChange={onNav}/></>;
  if (tab === 'settings') return <><SettingsScreen maxExtra={maxExtra} setMaxExtra={setMaxExtra}/><BottomNav active={tab} onChange={onNav}/></>;
  if (tab === 'impact') return <><ImpactScreen /><BottomNav active={tab} onChange={onNav}/></>;

  let content;
  if (step === 'landing') content = <LandingScreen busy={busy} maxExtra={maxExtra} setMaxExtra={setMaxExtra} onAnalyze={runAnalysis}/>;
  else if (step === 'analysis') content = <AnalysisScreen error={error} onBack={() => setStep('landing')}/>;
  else if (step === 'overview' && analysis) content = <OverviewScreen analysis={analysis} onChanges={() => setStep('changes')} onKeep={() => { setAnalysis(null); setStep('landing'); }}/>;
  else if (step === 'changes' && analysis) content = <ChangesScreen analysis={analysis} onBack={() => setStep('overview')} onWhy={openWhy} onFinal={() => setStep('final')}/>;
  else if (step === 'final' && analysis) content = <FinalPlanScreen analysis={analysis} onBack={() => setStep('changes')} onAccept={acceptPlan} busy={busy}/>;
  else if (step === 'accepted' && accepted) content = <AcceptedScreen plan={accepted} onDone={() => { setTab('today'); setStep('overview'); }}/>;
  else content = <LandingScreen busy={busy} maxExtra={maxExtra} setMaxExtra={setMaxExtra} onAnalyze={runAnalysis}/>;

  const showMap = analysis && ['overview', 'changes', 'final', 'accepted'].includes(step);

  return <>
    {error && step === 'landing' && <div style={{background: 'var(--red)', color: 'white', padding: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold'}}>{error}</div>}
    {showMap ? (
      <div className="split-layout">
        <div className="split-left">{content}</div>
        <div className="split-right">
          <Map trips={analysis.trips} />
        </div>
      </div>
    ) : (
      content
    )}
    
    {analysis && !['landing', 'analysis'].includes(step) && <BottomNav active={tab} onChange={onNav}/>}
    {whyTrip && <Drawer title="Why this changed" onClose={() => setWhyTrip(null)}>
      <div className="why-body">
        <div className="why-copy">{whyText}</div>
        <dl>
          <div><dt>Original modeled exposure</dt><dd>{whyTrip.original.modeledExposure.toFixed(0)}</dd></div>
          <div><dt>Recommended</dt><dd>{whyTrip.recommended.modeledExposure.toFixed(0)}</dd></div>
          <div><dt>Extra travel</dt><dd>{whyTrip.recommended.travelMinutes - whyTrip.original.travelMinutes >= 0 ? '+' : ''}{whyTrip.recommended.travelMinutes - whyTrip.original.travelMinutes} min</dd></div>
        </dl>
        <div className="fine-print">Numbers come from the deterministic optimizer.</div>
      </div>
    </Drawer>}
  </>;
}
