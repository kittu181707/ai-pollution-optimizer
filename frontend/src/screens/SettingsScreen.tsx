import { PRODUCT_NAME } from '../config';

export function SettingsScreen({ maxExtra, setMaxExtra }: { maxExtra: number; setMaxExtra: (v: number) => void }) {
  return <div className="screen narrow with-nav"><div className="screen-title"><p className="eyebrow">SETTINGS</p><h1>Preferences</h1><p>{PRODUCT_NAME} uses these as constraints, not as health advice.</p></div><section className="preference-card vertical"><div><h2>Default extra-travel budget</h2><p>Maximum additional travel minutes the optimizer may use across the whole day.</p></div><div className="segmented">{[0,5,10,15].map((v) => <button key={v} className={maxExtra === v ? 'selected' : ''} onClick={() => setMaxExtra(v)}>{v ? `+${v}` : '0'} min</button>)}</div></section><div className="info-card"><strong>Scientific wording</strong><p>Results are modeled estimates for decision support. They are not medical safety or exact dose claims.</p></div></div>;
}
