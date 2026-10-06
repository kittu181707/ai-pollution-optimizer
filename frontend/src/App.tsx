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
import type { AcceptedPlan, AgendaPayload, CalendarEvent, DayAnalysis, JourneyInput, TripAnalysis } from './types';
import { deriveJourneys, getUserId, localDate, readStoredNumber, storeNumber, uid } from './utils';

const blankAgenda = (): AgendaPayload => ({ date: localDate(), homeLocation: 'Home', events: [] });
const blankEvent = (): CalendarEvent => ({ eventId: uid('event'), title: '', location: '', start: '09:00', end: '10:00', fixed: true });
type Step = 'landing'|'import'|'manual'|'travel'|'analysis'|'overview'|'changes'|'final'|'accepted';
type AgendaMode = 'import' | 'manual';

export default function App() {
  const [step, setStep] = useState<Step>('landing');
  const [agendaMode, setAgendaMode] = useState<AgendaMode>('manual');
  const [agenda, setAgenda] = useState<AgendaPayload>(blankAgenda);
  const [journeys, setJourneys] = useState<JourneyInput[]>([]);
  const [maxExtra, setMaxExtraState] = useState(() => {
    const stored = readStoredNumber('max_extra_minutes', 10);
    return [0, 5, 10, 15].includes(stored) ? stored : 10;
  });
  const [analysis, setAnalysis] = useState<DayAnalysis | null>(null);
  const [accepted, setAccepted] = useState<AcceptedPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [historyError, setHistoryError] = useState<string>();
  const [whyTrip, setWhyTrip] = useState<TripAnalysis | null>(null);
  const [whyText, setWhyText] = useState('');
  const [tab, setTab] = useState<NavTab>('today');
  const [history, setHistory] = useState<AcceptedPlan[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const userId = useMemo(() => getUserId(), []);
  const setMaxExtra = (value: number) => {
    setMaxExtraState(value);
    storeNumber('max_extra_minutes', value);
  };

  const startAgenda = (mode: AgendaMode) => {
    setIsDemo(false);
    setAnalysis(null);
    setAccepted(null);
    setTab('today');
    setAgendaMode(mode);
    setAgenda({ ...blankAgenda(), events: mode === 'manual' ? [blankEvent()] : [] });
    setJourneys([]);
    setError(undefined);
    setStep(mode);
  };

  const loadDemo = async () => {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const demo = await api.getDemoDay();
      const demoJourneys = deriveJourneys(demo.events, demo.homeLocation).map((journey, index) => ({
        ...journey,
        departureTime: ['07:45', '12:00', '17:45', '19:20'][index] || journey.departureTime,
        mode: (['car', 'metro', 'metro', 'bike'][index] || journey.mode) as JourneyInput['mode'],
      }));
      setIsDemo(true);
      setAnalysis(null);
      setAccepted(null);
      setTab('today');
      setAgenda(demo);
      setJourneys(demoJourneys);
      setAgendaMode('manual');
      setStep('travel');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Could not load demo day');
    } finally {
      setBusy(false);
    }
  };

  const importIcs = async (file: File) => {
    if (busy) return;
    if (file.size > 512_000) {
      setError('Calendar file must be smaller than 512 KB');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const parsed = await api.parseIcs(await file.text());
      setAgenda({ ...parsed, homeLocation: agenda.homeLocation || 'Home' });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Could not parse calendar');
    } finally {
      setBusy(false);
    }
  };

  const continueToTravel = () => {
    setJourneys(deriveJourneys(agenda.events, agenda.homeLocation));
    setError(undefined);
    setStep('travel');
  };

  const runAnalysis = async () => {
    if (busy) return;
    setError(undefined);
    setBusy(true);
    setStep('analysis');
    try {
      const result = await api.analyzeDay({ ...agenda, userId, journeys, maxExtraMinutes: maxExtra, demoMode: isDemo });
      setAnalysis(result);
      setTab('today');
      setStep('overview');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Analysis failed');
    } finally {
      setBusy(false);
    }
  };

  const acceptPlan = async () => {
    if (!analysis || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const saved = await api.acceptPlan(userId, analysis.planId);
      setAccepted(saved);
      setStep('accepted');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Could not save plan');
    } finally {
      setBusy(false);
    }
  };

  const openWhy = async (trip: TripAnalysis) => {
    setWhyTrip(trip);
    setWhyText(trip.explanation);
    try {
      if (!analysis) return;
      const result = await api.explain(analysis.planId, trip);
      setWhyText(result.explanation);
    } catch {
      // Keep the verified deterministic explanation.
    }
  };

  const refreshHistory = async () => {
    if (historyLoading) return;
    setHistoryLoading(true);
    setHistoryError(undefined);
    try {
      const result = await api.history(userId);
      setHistory(result.plans);
    } catch (exception) {
      setHistoryError(exception instanceof Error ? exception.message : 'Could not load saved plans');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'history') void refreshHistory();
  }, [tab]);

  const onNav = (next: NavTab) => {
    if (next === 'plan' && !analysis) {
      setTab('today');
      setStep('landing');
      return;
    }
    setTab(next);
    if (next === 'today') setStep(analysis ? 'overview' : 'landing');
    if (next === 'plan' && analysis) setStep('final');
  };

  if (tab === 'history') {
    return <><HistoryScreen plans={history} loading={historyLoading} error={historyError} onRefresh={refreshHistory}/><BottomNav active={tab} onChange={onNav}/></>;
  }
  if (tab === 'settings') {
    return <><SettingsScreen maxExtra={maxExtra} setMaxExtra={setMaxExtra}/><BottomNav active={tab} onChange={onNav}/></>;
  }

  let content;
  if (step === 'landing') content = <LandingScreen busy={busy} error={error} onImport={() => startAgenda('import')} onManual={() => startAgenda('manual')} onDemo={loadDemo}/>;
  else if (step === 'import' || step === 'manual') content = <ImportScreen agenda={agenda} setAgenda={setAgenda} mode={step} onBack={() => setStep('landing')} onContinue={continueToTravel} onIcs={importIcs} busy={busy} error={error}/>;
  else if (step === 'travel') content = <TravelScreen journeys={journeys} setJourneys={setJourneys} maxExtra={maxExtra} setMaxExtra={setMaxExtra} onBack={() => setStep(agendaMode)} onAnalyze={runAnalysis}/>;
  else if (step === 'analysis') content = <AnalysisScreen error={error} onBack={() => setStep('travel')}/>;
  else if (step === 'overview' && analysis) content = <OverviewScreen analysis={analysis} onChanges={() => setStep('changes')} onKeep={() => startAgenda('manual')}/>;
  else if (step === 'changes' && analysis) content = <ChangesScreen analysis={analysis} onBack={() => setStep('overview')} onWhy={openWhy} onFinal={() => setStep('final')}/>;
  else if (step === 'final' && analysis) content = <FinalPlanScreen analysis={analysis} onBack={() => setStep('changes')} onAccept={acceptPlan} busy={busy} error={error}/>;
  else if (step === 'accepted' && accepted) content = <AcceptedScreen plan={accepted} onDone={() => { setTab('today'); setStep('overview'); }}/>;
  else content = <LandingScreen busy={busy} error={error} onImport={() => startAgenda('import')} onManual={() => startAgenda('manual')} onDemo={loadDemo}/>;

  return <>
    {content}
    {analysis && !['landing', 'import', 'manual', 'travel', 'analysis'].includes(step) && <BottomNav active={tab} onChange={onNav}/>}
    {whyTrip && <Drawer title="Why this changed" onClose={() => setWhyTrip(null)}>
      <div className="why-body">
        <div className="why-copy">{whyText}</div>
        <dl>
          <div><dt>Current</dt><dd>{whyTrip.original.modeledExposure.toFixed(0)}</dd></div>
          <div><dt>Recommended</dt><dd>{whyTrip.recommended.modeledExposure.toFixed(0)}</dd></div>
          <div><dt>Travel change</dt><dd>{(whyTrip.recommended.travelMinutes - whyTrip.original.travelMinutes >= 0 ? '+' : '') + (whyTrip.recommended.travelMinutes - whyTrip.original.travelMinutes) + ' min'}</dd></div>
        </dl>
        <div className="fine-print">Numbers come from the deterministic optimizer.</div>
      </div>
    </Drawer>}
  </>;
}
