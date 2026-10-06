import type { ReactNode } from 'react';
import { BottomNav, type NavTab } from './BottomNav';

export function AppShell({ active, onChange, children }: {
  active: NavTab;
  onChange: (tab: NavTab) => void;
  children: ReactNode;
}) {
  return <div className="app-shell">
    <BottomNav active={active} onChange={onChange}/>
    <main className="app-main">{children}</main>
  </div>;
}
