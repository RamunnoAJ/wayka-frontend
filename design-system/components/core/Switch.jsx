import React from 'react';
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label style={{ display:'inline-flex', gap:10, alignItems:'center', cursor:disabled?'not-allowed':'pointer' }}>
      <button type="button" role="switch" aria-checked={!!checked} disabled={disabled}
        onClick={()=>onChange && onChange(!checked)}
        style={{ width:42, height:24, padding:2, borderRadius:'var(--radius-pill)', border:0,
          background: checked ? 'var(--color-primary-strong)' : 'var(--neutral-300)',
          cursor:disabled?'not-allowed':'pointer', transition:'background-color var(--dur-fast) var(--ease-standard)' }}>
        <span style={{ display:'block', width:20, height:20, borderRadius:'50%', background:'#fff',
          boxShadow:'var(--shadow-xs)', transform:`translateX(${checked?18:0}px)`,
          transition:'transform var(--dur-fast) var(--ease-standard)' }} />
      </button>
      {label && <span style={{ font:'var(--text-body)', color:'var(--text-body)' }}>{label}</span>}
    </label>
  );
}
