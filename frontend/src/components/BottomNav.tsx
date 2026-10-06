import { CalendarDays, History, Route, Settings } from 'lucide-react';
import { Brand } from './Brand';

export type NavTab = 'today' | 'plan' | 'history' | 'settings';

export function BottomNav({ active, onChange }: { active: NavTab; onChange: (tab: NavTab) => void }) {
  const items = [
    ['today', 'Today', CalendarDays],
    ['plan', 'Plan', Route],
    ['history', 'History', History],
    ['settings', 'Settings', Settings],
  ] as const;

  return <nav className="bottom-nav primary-nav" aria-label="Primary navigation">
    <div className="nav-brand"><Brand/></div>
    <div className="nav-items">
      {items.map(([value, label, Icon]) => <button
        key={value}
        className={active === value ? 'active' : ''}
        aria-current={active === value ? 'page' : undefined}
        onClick={() => onChange(value)}
      ><Icon size={18}/><span>{label}</span></button>)}
    </div>
    <div className="nav-foot">Modeled estimates</div>
  </nav>;
}
