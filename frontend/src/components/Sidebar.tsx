import { CalendarDays, Route, BarChart3, Map as MapIcon, History, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';

export type NavTab = 'today' | 'optimize' | 'impact' | 'india' | 'history' | 'settings';

export function Sidebar({ active, onChange }: { active: NavTab; onChange: (tab: NavTab) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [
    { value: 'today', label: 'TODAY', Icon: CalendarDays },
    { value: 'optimize', label: 'OPTIMIZE', Icon: Route },
    { value: 'impact', label: 'IMPACT', Icon: BarChart3 },
    { value: 'india', label: 'INDIA', Icon: MapIcon },
    { value: 'history', label: 'HISTORY', Icon: History },
    { value: 'settings', label: 'SETTINGS', Icon: Settings },
  ] as const;

  const closeAndNav = (val: NavTab) => {
    onChange(val);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-top-bar">
        <div className="brand">
          <div className="brand-mark"></div>
          AI Personal Pollution Optimizer
        </div>
        <button className="icon-button" onClick={() => setMobileOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-head">
              <div className="brand">
                <div className="brand-mark"></div>
              </div>
              <button className="icon-button" onClick={() => setMobileOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="sidebar-nav">
              {items.map(({ value, label, Icon }) => (
                <button key={value} className={active === value ? 'active' : ''} onClick={() => closeAndNav(value)}>
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">
        <div className="brand">
          <div className="brand-mark"></div>
        </div>
        <div className="brand-text">
          <strong>AI Personal Pollution Optimizer</strong>
          <small>Make every journey healthier, without changing your day.</small>
        </div>
        <nav className="sidebar-nav">
          {items.map(({ value, label, Icon }) => (
            <button key={value} className={active === value ? 'active' : ''} onClick={() => onChange(value as NavTab)}>
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
