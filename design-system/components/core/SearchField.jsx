import React from 'react';
import { Icon } from './Icon.jsx';
export function SearchField({ placeholder='Buscar paciente, tutor o ID', value, onChange, size='md', ...rest }) {
  const [f,setF]=React.useState(false);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
      height: size==='lg'?'var(--control-h-lg)':'var(--control-h-md)', padding:'0 14px',
      borderRadius:'var(--radius-pill)', background:'var(--surface-card)',
      border:'1px solid '+(f?'var(--border-focus)':'var(--border-default)'),
      boxShadow:f?'var(--ring-focus)':'var(--shadow-xs)', transition:'var(--transition-control)' }}>
      <Icon name="search" size={17} style={{ color:'var(--text-subtle)' }} />
      <input value={value} onChange={onChange} placeholder={placeholder} onFocus={()=>setF(true)} onBlur={()=>setF(false)} {...rest}
        style={{ flex:1, minWidth:0, border:0, outline:0, background:'transparent', font:'var(--text-body)', color:'var(--text-strong)' }} />
    </div>
  );
}
