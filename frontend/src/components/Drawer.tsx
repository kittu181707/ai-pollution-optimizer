import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Drawer({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
      <div className="drawer-head">
        <div><div className="eyebrow">WHY THIS CHANGE</div><h2>{title}</h2></div>
        <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19}/></button>
      </div>
      {children}
    </section>
  </div>;
}
