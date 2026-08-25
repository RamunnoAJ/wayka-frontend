import React from 'react';
import { Icon } from './Icon.jsx';
export function Tag({ children, onRemove, tone='neutral' }) {
  const c = tone==='danger' ? ['var(--surface-card)','var(--text-danger)','var(--border-default)'] : ['var(--surface-card)','var(--text-body)','var(--border-default)'];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 8px 4px 10px',
      borderRadius:'var(--radius-sm)', background:c[0], color:c[1], border:`1px solid ${c[2]}`,
      font:'var(--fw-medium) var(--fs-body-sm)/1.4 var(--font-sans)' }}>
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Quitar"
          style={{ border:0, background:'transparent', padding:0, cursor:'pointer', color:'inherit', opacity:.6, display:'grid' }}>
          <Icon name="x" size={13} />
        </button>
      )}
    </span>
  );
}
