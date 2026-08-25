import React from 'react';
export function Textarea({ label, hint, rows=4, id, ...rest }) {
  const [f,setF]=React.useState(false); const uid=id||React.useId();
  return (
    <label htmlFor={uid} style={{ display:'grid', gap:6, width:'100%' }}>
      {label && <span style={{ font:'var(--text-caption)', color:'var(--text-muted)' }}>{label}</span>}
      <textarea id={uid} rows={rows} onFocus={()=>setF(true)} onBlur={()=>setF(false)} {...rest}
        style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--radius-control)',
          border:'1px solid '+(f?'var(--border-focus)':'var(--border-default)'),
          boxShadow: f?'var(--ring-focus)':'none', outline:0, resize:'vertical',
          font:'var(--text-body)', color:'var(--text-strong)', background:'var(--surface-card)',
          transition:'var(--transition-control)', ...rest.style }} />
      {hint && <span style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{hint}</span>}
    </label>
  );
}
