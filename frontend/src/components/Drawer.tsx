import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Drawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
      <div className="drawer-head"><div><p className="eyebrow">WHY?</p><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X/></button></div>
      {children}
    </section>
  </div>;
}
