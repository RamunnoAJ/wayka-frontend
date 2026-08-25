import React from 'react';
import { Icon } from './Icon.jsx';
export function Select({ label, options=[], hint, id, ...rest }) {
  const [f,setF]=React.useState(false); const uid=id||React.useId();
  return (
    <label htmlFor={uid} style={{ display:'grid', gap:6, width:'100%' }}>
      {label && <span style={{ font:'var(--text-caption)', color:'var(--text-muted)' }}>{label}</span>}
      <span style={{ position:'relative', display:'block' }}>
        <select id={uid} onFocus={()=>setF(true)} onBlur={()=>setF(false)} {...rest}
          style={{ width:'100%', height:'var(--control-h-md)', padding:'0 36px 0 12px',
            appearance:'none', borderRadius:'var(--radius-control)',
            border:'1px solid '+(f?'var(--border-focus)':'var(--border-default)'),
            boxShadow:f?'var(--ring-focus)':'none', outline:0,
            font:'var(--text-body)', color:'var(--text-strong)', background:'var(--surface-card)',
            transition:'var(--transition-control)' }}>
          {options.map(o => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="chevron-down" size={16} style={{ position:'absolute', right:12, top:12, color:'var(--text-subtle)', pointerEvents:'none' }} />
      </span>
      {hint && <span style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{hint}</span>}
    </label>
  );
}
