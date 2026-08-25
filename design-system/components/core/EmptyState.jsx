import React from 'react';
import { Icon } from './Icon.jsx';
export function EmptyState({ icon='paw-print', title, description, action }) {
  return (
    <div style={{ display:'grid', justifyItems:'center', gap:8, textAlign:'center', padding:'var(--space-10) var(--space-7)' }}>
      <span style={{ width:56, height:56, borderRadius:'var(--radius-lg)', display:'grid', placeItems:'center',
        background:'var(--surface-accent-soft)', color:'var(--color-primary-strong)', marginBottom:4 }}>
        <Icon name={icon} size={26} />
      </span>
      <div style={{ font:'var(--text-h4)', color:'var(--text-strong)' }}>{title}</div>
      {description && <p style={{ font:'var(--text-body)', color:'var(--text-muted)', maxWidth:360 }}>{description}</p>}
      {action && <div style={{ marginTop:8 }}>{action}</div>}
    </div>
  );
}
