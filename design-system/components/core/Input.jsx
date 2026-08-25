import React from 'react';
import { Icon } from './Icon.jsx';
export function Input({ label, hint, error, icon, suffix, readOnly, id, ...rest }) {
  const [f,setF]=React.useState(false);
  const uid = id || React.useId();
  return (
    <label htmlFor={uid} style={{ display:'grid', gap:6, width:'100%' }}>
      {label && <span style={{ font:'var(--text-caption)', color:'var(--text-muted)' }}>{label}</span>}
      <span style={{ display:'flex', alignItems:'center', gap:8,
        height:'var(--control-h-md)', padding:'0 12px', borderRadius:'var(--radius-control)',
        background: readOnly ? 'var(--surface-sunken)' : 'var(--surface-card)',
        border:'1px solid '+(error?'var(--border-danger)':f?'var(--border-focus)':'var(--border-default)'),
        boxShadow: f ? (error?'var(--ring-danger)':'var(--ring-focus)') : 'none',
        transition:'var(--transition-control)' }}>
        {icon && <Icon name={icon} size={16} style={{ color:'var(--text-subtle)' }} />}
        <input id={uid} readOnly={readOnly} onFocus={()=>setF(true)} onBlur={()=>setF(false)} {...rest}
          style={{ flex:1, minWidth:0, border:0, outline:0, background:'transparent',
            font:'var(--text-body)', color:'var(--text-strong)' }} />
        {suffix && <span style={{ font:'var(--text-caption)', color:'var(--text-subtle)' }}>{suffix}</span>}
      </span>
      {(hint||error) && <span style={{ font:'var(--fs-caption) var(--font-sans)', color: error?'var(--text-danger)':'var(--text-subtle)' }}>{error||hint}</span>}
    </label>
  );
}
