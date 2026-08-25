import React from 'react';
import { IconButton } from './IconButton.jsx';
export function Dialog({ open, title, description, children, footer, onClose, width=520 }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(30,20,40,.42)',
        backdropFilter:'blur(2px)', display:'grid', placeItems:'center', padding:24 }}>
      <div onClick={e=>e.stopPropagation()}
        style={{ width:'100%', maxWidth:width, background:'var(--surface-card)',
          borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-overlay)', overflow:'hidden' }}>
        <header style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, padding:'20px var(--gutter-card) 0' }}>
          <div style={{ display:'grid', gap:4 }}>
            <h2 style={{ font:'var(--text-h3)', color:'var(--text-strong)' }}>{title}</h2>
            {description && <p style={{ font:'var(--text-body)', color:'var(--text-muted)' }}>{description}</p>}
          </div>
          {onClose && <IconButton icon="x" label="Cerrar" size="sm" onClick={onClose} />}
        </header>
        <div style={{ padding:'16px var(--gutter-card)' }}>{children}</div>
        {footer && <footer style={{ display:'flex', justifyContent:'flex-end', gap:8,
          padding:'16px var(--gutter-card)', background:'var(--surface-sunken)', borderTop:'1px solid var(--border-subtle)' }}>{footer}</footer>}
      </div>
    </div>
  );
}
