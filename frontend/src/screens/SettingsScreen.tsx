import { Clock3, Info } from 'lucide-react';

export function SettingsScreen({ maxExtra, setMaxExtra }: { maxExtra: number; setMaxExtra: (value: number) => void }) {
  return <div className="screen narrow with-nav">
    <div className="eyebrow">SETTINGS</div>
    <h1 className="page-heading">Preferences</h1>
    <section className="settings-card">
      <div className="setting-title"><Clock3 size={19}/><div><strong>Default extra travel</strong><span>Whole-day limit</span></div></div>
      <div className="segmented">{[0, 5, 10, 15].map((value) => <button key={value} className={maxExtra === value ? 'selected' : ''} aria-pressed={maxExtra === value} onClick={() => setMaxExtra(value)}>{value ? '+' + value : '0'}</button>)}</div>
    </section>
    <section className="settings-note"><Info size={18}/><div><strong>Modeled estimates</strong><span>Decision support, not medical safety.</span></div></section>
  </div>;
}
