import React from 'react';
import { IconButton } from './IconButton.jsx';
/** Panel que entra desde un borde. En movil siempre desde abajo; en web, side="right". */
export function Sheet({ open, title, description, children, footer, onClose, side='bottom', height='auto', width=420 }) {
  if (!open) return null;
  const bottom = side === 'bottom';
  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{ position:'absolute', inset:0, zIndex:60, background:'rgba(30,20,40,.42)',
        display:'flex', alignItems: bottom ? 'flex-end' : 'stretch', justifyContent: bottom ? 'stretch' : 'flex-end' }}>
      <div onClick={e=>e.stopPropagation()}
        style={{ background:'var(--surface-card)', boxShadow:'var(--shadow-overlay)',
          display:'flex', flexDirection:'column', maxHeight:'100%',
          width: bottom ? '100%' : width, height: bottom ? height : '100%',
          borderRadius: bottom ? 'var(--radius-lg) var(--radius-lg) 0 0' : 0 }}>
        {bottom && <span aria-hidden="true" style={{ width:36, height:4, borderRadius:'var(--radius-pill)',
          background:'var(--border-default)', margin:'10px auto 0' }} />}
        <header style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16,
          padding:`${bottom ? 12 : 20}px var(--gutter-card) 0` }}>
          <div style={{ display:'grid', gap:4 }}>
            {title && <h2 style={{ font:'var(--text-h3)', color:'var(--text-strong)' }}>{title}</h2>}
            {description && <p style={{ font:'var(--text-body)', color:'var(--text-muted)' }}>{description}</p>}
          </div>
          {onClose && !bottom && <IconButton icon="x" label="Cerrar" size="sm" onClick={onClose} />}
        </header>
        <div style={{ padding:'14px var(--gutter-card)', overflowY:'auto', flex:1 }}>{children}</div>
        {footer && <footer style={{ display:'flex', gap:8, padding:'14px var(--gutter-card)',
          borderTop:'1px solid var(--border-subtle)' }}>{footer}</footer>}
      </div>
    </div>
  );
}
