import { useRef } from 'react';
import { ArrowRight, Clock3, FileUp, MapPin, Plus, Trash2 } from 'lucide-react';
import type { AgendaPayload, CalendarEvent } from '../types';
import { FlowHeader } from '../components/FlowHeader';
import { uid } from '../utils';

export function ImportScreen({ agenda, setAgenda, mode, onBack, onContinue, onIcs, busy, error }: {
  agenda: AgendaPayload;
  setAgenda: (agenda: AgendaPayload) => void;
  mode: 'import'|'manual';
  onBack: () => void;
  onContinue: () => void;
  onIcs: (file: File) => void;
  busy: boolean;
  error?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const update = (id: string, patch: Partial<CalendarEvent>) =>
    setAgenda({ ...agenda, events: agenda.events.map((event) => event.eventId === id ? { ...event, ...patch } : event) });
  const add = () => {
    if (agenda.events.length >= 6) return;
    setAgenda({ ...agenda, events: [...agenda.events, { eventId: uid('event'), title: '', location: '', start: '09:00', end: '10:00', fixed: true }] });
  };
  const remove = (id: string) => setAgenda({ ...agenda, events: agenda.events.filter((event) => event.eventId !== id) });
  const incomplete = !agenda.homeLocation.trim() || !agenda.events.length || agenda.events.some((event) => !event.title.trim() || !event.location.trim());

  return <div className="screen wide">
    <FlowHeader step={1} onBack={onBack}/>

    <div className="screen-title compact-title">
      <div className="eyebrow">BUILD TODAY</div>
      <h1>{mode === 'import' ? 'Import your day' : 'Add your day'}</h1>
      <div className="screen-hint">Places + fixed times</div>
    </div>

    <section className="home-card">
      <MapPin size={19}/>
      <label><span>Start from</span><input value={agenda.homeLocation} onChange={(event) => setAgenda({ ...agenda, homeLocation: event.target.value })} placeholder="Home, city"/></label>
      {mode === 'import' && <>
        <input ref={fileRef} hidden type="file" accept=".ics,text/calendar" onChange={(event) => event.target.files?.[0] && onIcs(event.target.files[0])}/>
        <button className="secondary upload-button" disabled={busy} onClick={() => fileRef.current?.click()}>
          <FileUp size={17}/>{busy ? 'Importing' : 'Choose .ics'}
        </button>
      </>}
    </section>

    {error && <div className="error-banner" role="alert">{error}</div>}

    <div className="section-row"><strong>Events</strong><span>{agenda.events.length}/6</span></div>

    {!agenda.events.length && <button className="empty-add" onClick={add}>
      <Plus size={20}/><strong>Add your first event</strong><span>Name, place, start, end</span>
    </button>}

    <div className="event-list">
      {agenda.events.map((event, index) => <article className="event-card" key={event.eventId}>
        <div className="event-number">{index + 1}</div>
        <div className="event-fields">
          <input className="event-title" aria-label="Event name" value={event.title} placeholder="Event name" onChange={(e) => update(event.eventId, { title: e.target.value })}/>
          <div className="input-with-icon"><MapPin size={16}/><input aria-label="Event location" value={event.location} placeholder="Location" onChange={(e) => update(event.eventId, { location: e.target.value })}/></div>
          <div className="time-row">
            <label><span><Clock3 size={14}/>Start</span><input type="time" value={event.start} onChange={(e) => update(event.eventId, { start: e.target.value })}/></label>
            <label><span>End</span><input type="time" value={event.end} onChange={(e) => update(event.eventId, { end: e.target.value })}/></label>
            <label className="fixed-toggle"><input type="checkbox" checked={event.fixed} onChange={(e) => update(event.eventId, { fixed: e.target.checked })}/><span>Fixed</span></label>
          </div>
        </div>
        <button className="icon-button danger" onClick={() => remove(event.eventId)} aria-label="Remove event"><Trash2 size={18}/></button>
      </article>)}
    </div>

    {agenda.events.length > 0 && agenda.events.length < 6 && <button className="dashed" onClick={add}><Plus size={18}/>Add event</button>}

    <div className="sticky-actions solid"><button className="primary cta" disabled={incomplete} onClick={onContinue}>Continue to travel<ArrowRight size={18}/></button></div>
  </div>;
}
