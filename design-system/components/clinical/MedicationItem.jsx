import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function MedicationItem({ name, dose, frequency, until, prescriber, status='activo', action }) {
  const ended = status !== 'activo';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
      background:'var(--surface-card)', border:'1px solid var(--border-subtle)',
      borderRadius:'var(--radius-md)', opacity: ended ? .62 : 1 }}>
      <span style={{ width:32, height:32, flex:'0 0 auto', borderRadius:'var(--radius-sm)', display:'grid', placeItems:'center',
        background: ended ? 'var(--neutral-100)' : 'var(--color-primary-soft)',
        color: ended ? 'var(--text-subtle)' : 'var(--color-primary-strong)' }}>
        <Icon name="pill" size={16} />
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'baseline', flexWrap:'wrap' }}>
          <span style={{ font:'var(--text-body-strong)', color:'var(--text-strong)',
            textDecoration: ended ? 'line-through' : 'none' }}>{name}</span>
          <span style={{ font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>{dose}</span>
        </div>
        <div style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)', marginTop:2 }}>
          {[frequency, until && `hasta ${until}`, prescriber].filter(Boolean).join(' · ')}
        </div>
      </div>
      {action}
    </div>
  );
}
