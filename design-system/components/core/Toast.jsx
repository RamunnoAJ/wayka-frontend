import React from 'react';
import { Icon } from './Icon.jsx';
const T = { success:['var(--success-500)','check-circle'], danger:['var(--danger-500)','alert-circle'], info:['var(--color-primary-strong)','info'], warning:['var(--warning-500)','alert-triangle'] };
export function Toast({ tone='success', title, description, onClose }) {
  const [c,icon] = T[tone] || T.info;
  return (
    <div role="status" style={{ display:'flex', gap:12, alignItems:'flex-start', width:'100%', maxWidth:400,
      background:'var(--surface-card)', border:'1px solid var(--border-default)', borderLeft:`3px solid ${c}`,
      borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-lg)', padding:'14px 16px' }}>
      <Icon name={icon} size={18} style={{ color:c, marginTop:1 }} />
      <div style={{ display:'grid', gap:2, flex:1 }}>
        <div style={{ font:'var(--text-body-strong)', color:'var(--text-strong)' }}>{title}</div>
        {description && <div style={{ font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>{description}</div>}
      </div>
      {onClose && <button onClick={onClose} aria-label="Cerrar" style={{ border:0, background:'transparent', cursor:'pointer', color:'var(--text-subtle)', display:'grid' }}><Icon name="x" size={15} /></button>}
    </div>
  );
}
