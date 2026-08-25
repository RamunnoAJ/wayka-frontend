import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function MobileTabBar({ items=[], value, onChange }) {
  return (
    <nav style={{ display:'flex', background:'var(--surface-card)', borderTop:'1px solid var(--border-default)',
      padding:'8px 6px calc(8px + env(safe-area-inset-bottom))' }}>
      {items.map(it => {
        const on = it.value === value;
        return (
          <button key={it.value} onClick={()=>onChange && onChange(it.value)}
            style={{ flex:1, minHeight:52, display:'grid', justifyItems:'center', gap:3, border:0, background:'transparent',
              cursor:'pointer', color: on ? 'var(--color-primary-strong)' : 'var(--text-subtle)',
              font:`${on?'var(--fw-semibold)':'var(--fw-medium)'} var(--fs-overline)/1.2 var(--font-sans)`,
              transition:'var(--transition-control)' }}>
            <Icon name={it.icon} size={21} />
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
