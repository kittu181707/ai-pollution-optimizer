import { useRef } from 'react';
import { ArrowLeft, FileUp, Plus, Trash2 } from 'lucide-react';
import type { AgendaPayload, CalendarEvent } from '../types';
import { uid } from '../utils';

export function ImportScreen({ agenda, setAgenda, mode, onBack, onContinue, onIcs, busy, error }: {
  agenda: AgendaPayload; setAgenda: (agenda: AgendaPayload) => void; mode: 'import'|'manual'; onBack: () => void; onContinue: () => void;
  onIcs: (file: File) => void; busy: boolean; error?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const update = (id: string, patch: Partial<CalendarEvent>) => setAgenda({ ...agenda, events: agenda.events.map((event) => event.eventId === id ? { ...event, ...patch } : event) });
  const add = () => setAgenda({ ...agenda, events: [...agenda.events, { eventId: uid('event'), title: '', location: '', start: '09:00', end: '10:00', fixed: true }] });
  const remove = (id: string) => setAgenda({ ...agenda, events: agenda.events.filter((event) => event.eventId !== id) });
  return <div className="screen wide">
    <button className="back" onClick={onBack}><ArrowLeft/>Back</button>
    <div className="screen-title"><p className="eyebrow">IMPORT DAY</p><h1>Today's plan</h1><p>Fixed appointments stay fixed. Confirm the locations and times we should plan around.</p></div>
    <div className="toolbar-card">
      <div><label>Home / starting location</label><input value={agenda.homeLocation} onChange={(e) => setAgenda({ ...agenda, homeLocation: e.target.value })} placeholder="Home, city"/></div>
      {mode === 'import' && <><input ref={fileRef} hidden type="file" accept=".ics,text/calendar" onChange={(e) => e.target.files?.[0] && onIcs(e.target.files[0])}/><button className="secondary" disabled={busy} onClick={() => fileRef.current?.click()}><FileUp/>{busy ? 'Importing…' : 'Import .ICS'}</button></>}
    </div>
    {error && <div className="error-banner">{error}</div>}
    <div className="event-list">
      {agenda.events.map((event, index) => <article className="event-card" key={event.eventId}>
        <div className="event-index">{String(index + 1).padStart(2, '0')}</div>
        <div className="event-fields">
          <input className="event-title" value={event.title} placeholder="Event name" onChange={(e) => update(event.eventId, { title: e.target.value })}/>
          <input value={event.location} placeholder="Location" onChange={(e) => update(event.eventId, { location: e.target.value })}/>
          <div className="time-row"><label>Start<input type="time" value={event.start} onChange={(e) => update(event.eventId, { start: e.target.value })}/></label><label>End<input type="time" value={event.end} onChange={(e) => update(event.eventId, { end: e.target.value })}/></label><label className="check"><input type="checkbox" checked={event.fixed} onChange={(e) => update(event.eventId, { fixed: e.target.checked })}/>Fixed</label></div>
        </div>
        <button className="icon-button danger" onClick={() => remove(event.eventId)} aria-label="Remove event"><Trash2/></button>
      </article>)}
    </div>
    <button className="dashed" onClick={add}><Plus/>Add event manually</button>
    <div className="sticky-actions"><button className="primary" disabled={!agenda.events.length || agenda.events.some((e) => !e.title || !e.location)} onClick={onContinue}>Continue</button></div>
  </div>;
}
