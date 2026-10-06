import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { BottomNav, type NavTab } from './components/BottomNav';
import { Drawer } from './components/Drawer';
import { AcceptedScreen } from './screens/AcceptedScreen';
import { AnalysisScreen } from './screens/AnalysisScreen';
import { ChangesScreen } from './screens/ChangesScreen';
import { FinalPlanScreen } from './screens/FinalPlanScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ImportScreen } from './screens/ImportScreen';
import { LandingScreen } from './screens/LandingScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TravelScreen } from './screens/TravelScreen';
import type { AcceptedPlan, AgendaPayload, DayAnalysis, JourneyInput, TripAnalysis } from './types';
import { deriveJourneys, getUserId } from './utils';

const today = new Date().toISOString().slice(0, 10);
const blankAgenda: AgendaPayload = { date: today, homeLocation: 'Home', events: [] };
type Step = 'landing'|'import'|'manual'|'travel'|'analysis'|'overview'|'changes'|'final'|'accepted';

export default function App() {
  const [step, setStep] = useState<Step>('landing');
  const [agenda, setAgenda] = useState<AgendaPayload>(blankAgenda);
  const [journeys, setJourneys] = useState<JourneyInput[]>([]);
  const [maxExtra, setMaxExtraState] = useState(() => Number(localStorage.getItem('max_extra_minutes') || 10));
  const [analysis, setAnalysis] = useState<DayAnalysis | null>(null);
  const [accepted, setAccepted] = useState<AcceptedPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [whyTrip, setWhyTrip] = useState<TripAnalysis | null>(null);
  const [whyText, setWhyText] = useState('');
  const [tab, setTab] = useState<NavTab>('today');
  const [history, setHistory] = useState<AcceptedPlan[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const userId = useMemo(() => getUserId(), []);
  const setMaxExtra = (value: number) => { setMaxExtraState(value); localStorage.setItem('max_extra_minutes', String(value)); };

  const loadDemo = async () => {
    setBusy(true); setError(undefined);
    try {
      const demo = await api.getDemoDay();
      const demoJourneys = deriveJourneys(demo.events, demo.homeLocation).map((journey, index) => ({
        ...journey,
        departureTime: ['07:45','12:00','17:45','19:20'][index] || journey.departureTime,
        mode: (['car','metro','metro','bike'][index] || journey.mode) as JourneyInput['mode'],
      }));
      setIsDemo(true); setAgenda(demo); setJourneys(demoJourneys); setStep('travel');
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load demo day'); }
    finally { setBusy(false); }
  };

  const importIcs = async (file: File) => {
    setBusy(true); setError(undefined);
    try { const parsed = await api.parseIcs(await file.text()); setAgenda({ ...parsed, homeLocation: agenda.homeLocation || 'Home' }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not parse calendar'); }
    finally { setBusy(false); }
  };

  const continueToTravel = () => { const next = deriveJourneys(agenda.events, agenda.homeLocation); setJourneys(next); setStep('travel'); };
  const runAnalysis = async () => {
    setStep('analysis'); setError(undefined); setBusy(true);
    try {
      const result = await api.analyzeDay({ ...agenda, userId, journeys, maxExtraMinutes: maxExtra, demoMode: isDemo });
      setAnalysis(result); setStep('overview');
    } catch (e) { setError(e instanceof Error ? e.message : 'Analysis failed'); }
    finally { setBusy(false); }
  };

  const acceptPlan = async () => {
    if (!analysis) return; setBusy(true); setError(undefined);
    try { const saved = await api.acceptPlan(userId, analysis.planId); setAccepted(saved); setStep('accepted'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save plan'); }
    finally { setBusy(false); }
  };

  const openWhy = async (trip: TripAnalysis) => {
    setWhyTrip(trip); setWhyText(trip.explanation);
    try { const result = await api.explain(trip); setWhyText(result.explanation); } catch { /* deterministic explanation remains */ }
  };

  const refreshHistory = async () => {
    setHistoryLoading(true);
    try { const result = await api.history(userId); setHistory(result.plans); } finally { setHistoryLoading(false); }
  };

  useEffect(() => { if (tab === 'history') void refreshHistory(); }, [tab]);

  const onNav = (next: NavTab) => {
    setTab(next);
    if (next === 'today') setStep(analysis ? 'overview' : 'landing');
    if (next === 'plan' && analysis) setStep('final');
  };

  if (tab === 'history') return <><HistoryScreen plans={history} loading={historyLoading} onRefresh={refreshHistory}/><BottomNav active={tab} onChange={onNav}/></>;
  if (tab === 'settings') return <><SettingsScreen maxExtra={maxExtra} setMaxExtra={setMaxExtra}/><BottomNav active={tab} onChange={onNav}/></>;

  let content;
  if (step === 'landing') content = <LandingScreen busy={busy} onImport={() => { setIsDemo(false); setAgenda(blankAgenda); setStep('import'); }} onManual={() => { setIsDemo(false); setAgenda(blankAgenda); setStep('manual'); }} onDemo={loadDemo}/>;
  else if (step === 'import' || step === 'manual') content = <ImportScreen agenda={agenda} setAgenda={setAgenda} mode={step} onBack={() => setStep('landing')} onContinue={continueToTravel} onIcs={importIcs} busy={busy} error={error}/>;
  else if (step === 'travel') content = <TravelScreen journeys={journeys} setJourneys={setJourneys} maxExtra={maxExtra} setMaxExtra={setMaxExtra} onBack={() => setStep('manual')} onAnalyze={runAnalysis}/>;
  else if (step === 'analysis') content = <AnalysisScreen error={error} onBack={() => setStep('travel')}/>;
  else if (step === 'overview' && analysis) content = <OverviewScreen analysis={analysis} onChanges={() => setStep('changes')} onKeep={() => { setAnalysis(null); setStep('landing'); }}/>;
  else if (step === 'changes' && analysis) content = <ChangesScreen analysis={analysis} onBack={() => setStep('overview')} onWhy={openWhy} onFinal={() => setStep('final')}/>;
  else if (step === 'final' && analysis) content = <FinalPlanScreen analysis={analysis} onBack={() => setStep('changes')} onAccept={acceptPlan} busy={busy}/>;
  else if (step === 'accepted' && accepted) content = <AcceptedScreen plan={accepted} onDone={() => { setTab('today'); setStep('overview'); }}/>;
  else content = <LandingScreen busy={busy} onImport={() => setStep('import')} onManual={() => setStep('manual')} onDemo={loadDemo}/>;

  return <>{content}{analysis && step !== 'landing' && step !== 'import' && step !== 'manual' && step !== 'travel' && step !== 'analysis' && <BottomNav active={tab} onChange={onNav}/>} {whyTrip && <Drawer title="Why this changed" onClose={() => setWhyTrip(null)}><div className="why-body"><p>{whyText}</p><dl><div><dt>Original modeled exposure</dt><dd>{whyTrip.original.modeledExposure.toFixed(0)}</dd></div><div><dt>Recommended</dt><dd>{whyTrip.recommended.modeledExposure.toFixed(0)}</dd></div><div><dt>Extra travel</dt><dd>{whyTrip.recommended.travelMinutes - whyTrip.original.travelMinutes >= 0 ? '+' : ''}{whyTrip.recommended.travelMinutes - whyTrip.original.travelMinutes} min</dd></div></dl><p className="fine-print">Explanation text may be produced by Bedrock from these structured values. Numeric values always come from the deterministic optimizer.</p></div></Drawer>}</>;
}
