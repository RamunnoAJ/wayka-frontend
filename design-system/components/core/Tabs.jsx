import React from 'react';
export function Tabs({ items=[], value, onChange, variant='underline' }) {
  const pill = variant==='pill' || variant==='segmented';
  const seg = variant==='segmented';
  return (
    <div role="tablist" style={{ display:'flex', gap: pill?4:24,
      padding: pill?4:0, borderRadius: pill?'var(--radius-pill)':0,
      background: pill?'var(--surface-sunken)':'transparent',
      borderBottom: pill?'none':'1px solid var(--border-default)' }}>
      {items.map(it=>{ const on = it.value===value; return (
        <button key={it.value} role="tab" aria-selected={on} onClick={()=>onChange&&onChange(it.value)}
          style={{ border:0, cursor:'pointer',
            background: seg&&on ? 'var(--color-primary-fill)' : pill&&on ? 'var(--surface-card)' : 'transparent',
            borderRadius: pill?'var(--radius-pill)':0,
            padding: pill?'7px 16px':'0 0 12px',
            boxShadow: pill&&on&&!seg?'var(--shadow-xs)':'none',
            borderBottom: pill?'none':`2px solid ${on?'var(--color-primary-strong)':'transparent'}`,
            marginBottom: pill?0:-1,
            font:`var(--fw-semibold) var(--fs-body)/1.4 var(--font-sans)`,
            color: seg&&on ? 'var(--color-primary-fill-fg)' : on?'var(--text-strong)':'var(--text-muted)',
            transition:'var(--transition-control)', display:'flex', gap:8, alignItems:'center' }}>
          {it.label}
          {it.count!=null && <span style={{ font:'var(--fw-semibold) var(--fs-overline) var(--font-sans)',
            background:'var(--neutral-100)', color:'var(--text-muted)', padding:'2px 6px', borderRadius:'var(--radius-pill)' }}>{it.count}</span>}
        </button>); })}
    </div>
  );
}
