import React from 'react';
import { Icon } from './Icon.jsx';
/** Tono = un punto, nunca un icono ni un borde de acento a la izquierda. */
const T = { success:'var(--success-100)', danger:'#E8A79E', info:'var(--nav-accent)', warning:'var(--warning-100)' };
export function Toast({ tone='success', title, description, action, onClose }) {
  const dot = T[tone] || T.info;
  return (
    <div role="status" data-surface="dark" style={{ display:'flex', gap:14, alignItems:'flex-start', width:'100%', maxWidth:420,
      background:'var(--surface-inverse)', borderRadius:'var(--radius-md)', padding:'13px 14px 13px 16px' }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:dot, flex:'0 0 auto', marginTop:7 }} />
      <div style={{ display:'grid', gap:3, flex:1, minWidth:0 }}>
        <div style={{ font:'var(--text-body-strong)', color:'var(--text-on-nav)' }}>{title}</div>
        {description && <div style={{ font:'var(--fs-body-sm)/1.5 var(--font-sans)', color:'var(--text-on-nav-muted)' }}>{description}</div>}
      </div>
      {action && <button onClick={action.onClick} style={{ border:0, background:'transparent', cursor:'pointer', padding:'2px 4px',
        color:'var(--text-on-nav)', font:'var(--fw-semibold) var(--fs-body-sm) var(--font-sans)', textDecoration:'underline',
        textUnderlineOffset:3, whiteSpace:'nowrap' }}>{action.label}</button>}
      {onClose && <button onClick={onClose} aria-label="Cerrar" style={{ border:0, background:'transparent', cursor:'pointer',
        color:'var(--text-on-nav-muted)', display:'grid', marginTop:1 }}><Icon name="x" size={15} /></button>}
    </div>
  );
}
