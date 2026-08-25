import React from 'react';
import { Icon } from './Icon.jsx';
export function Checkbox({ label, description, checked, onChange, disabled }) {
  return (
    <label style={{ display:'flex', gap:10, alignItems:'flex-start', cursor:disabled?'not-allowed':'pointer' }}>
      <input type="checkbox" checked={!!checked} onChange={onChange} disabled={disabled} style={{ position:'absolute', opacity:0, width:0, height:0 }} />
      <span style={{ width:20, height:20, flex:'0 0 auto', marginTop:1, display:'grid', placeItems:'center',
        borderRadius:'var(--radius-xs)',
        border:'1px solid '+(checked?'var(--color-primary-strong)':'var(--border-strong)'),
        background: checked ? 'var(--color-primary-strong)' : 'var(--surface-card)',
        color:'#fff', transition:'var(--transition-control)' }}>
        {checked && <Icon name="check" size={14} />}
      </span>
      <span style={{ display:'grid', gap:2 }}>
        <span style={{ font:'var(--text-body)', color:'var(--text-body)' }}>{label}</span>
        {description && <span style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{description}</span>}
      </span>
    </label>
  );
}
