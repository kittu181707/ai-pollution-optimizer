import { CalendarDays, History, Route, Settings, BarChart3 } from 'lucide-react';

export type NavTab = 'today' | 'plan' | 'impact' | 'history' | 'settings';

export function BottomNav({ active, onChange }: { active: NavTab; onChange: (tab: NavTab) => void }) {
  const items = [
    ['today', 'Today', CalendarDays], ['plan', 'Plan', Route], ['impact', 'Impact', BarChart3], ['history', 'History', History], ['settings', 'Settings', Settings],
  ] as const;
  return <nav className="bottom-nav" aria-label="Primary navigation">
    {items.map(([value, label, Icon]) => <button key={value} className={active === value ? 'active' : ''} onClick={() => onChange(value)}><Icon size={18}/><span>{label}</span></button>)}
  </nav>;
}
