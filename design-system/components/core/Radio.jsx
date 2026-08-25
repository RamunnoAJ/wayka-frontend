import React from 'react';
export function Radio({ label, description, checked, onChange, name, value, disabled }) {
  return (
    <label style={{ display:'flex', gap:10, alignItems:'flex-start', cursor:disabled?'not-allowed':'pointer' }}>
      <input type="radio" name={name} value={value} checked={!!checked} onChange={onChange} disabled={disabled} style={{ position:'absolute', opacity:0, width:0, height:0 }} />
      <span style={{ width:20, height:20, flex:'0 0 auto', marginTop:1, borderRadius:'50%', display:'grid', placeItems:'center',
        border:'1px solid '+(checked?'var(--color-primary-strong)':'var(--border-strong)'),
        background:'var(--surface-card)', transition:'var(--transition-control)' }}>
        {checked && <span style={{ width:10, height:10, borderRadius:'50%', background:'var(--color-primary-strong)' }} />}
      </span>
      <span style={{ display:'grid', gap:2 }}>
        <span style={{ font:'var(--text-body)', color:'var(--text-body)' }}>{label}</span>
        {description && <span style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{description}</span>}
      </span>
    </label>
  );
}
