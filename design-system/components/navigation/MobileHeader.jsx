import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function MobileHeader({ title, onBack, action, tone='light' }) {
  const dark = tone === 'dark';
  return (
    <header data-surface={dark ? 'dark' : undefined} style={{ display:'flex', alignItems:'center', gap:8, minHeight:56, padding:'0 8px 0 4px',
      background: dark ? 'var(--surface-nav)' : 'var(--surface-card)',
      color: dark ? 'var(--text-on-nav)' : 'var(--text-strong)',
      borderBottom: dark ? 'none' : '1px solid var(--border-subtle)' }}>
      {onBack && (
        <button onClick={onBack} aria-label="Volver" style={{ width:44, height:44, border:0, background:'transparent',
          cursor:'pointer', color:'inherit', display:'grid', placeItems:'center' }}>
          <Icon name="chevron-left" size={22} />
        </button>
      )}
      <h1 style={{ flex:1, font:'var(--text-h4)', color:'inherit', paddingLeft: onBack ? 0 : 12 }}>{title}</h1>
      {action}
    </header>
  );
}
