import React from 'react';
export function Card({ title, action, children, tone='default', padded=true, style }) {
  const tones = {
    default:{ bg:'var(--surface-card)', border:'var(--border-default)' },
    sunken:{ bg:'var(--surface-sunken)', border:'var(--border-subtle)' },
  };
  tones.clinical = tones.default; tones.owner = tones.default; // deprecados: la autoria se marca en el dato (DataField), no en el contenedor
  const t = tones[tone] || tones.default;
  return (
    <section style={{ background:t.bg, border:`1px solid ${t.border}`, borderRadius:'var(--radius-card)',
      overflow:'hidden', ...style }}>
      {(title || action) && (
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
          padding:'14px var(--gutter-card) 2px' }}>
          <h3 style={{ font:'var(--text-h4)', color:'var(--text-strong)' }}>{title}</h3>
          {action}
        </header>
      )}
      <div style={{ padding: padded ? 'var(--gutter-card)' : 0 }}>{children}</div>
    </section>
  );
}
