import React from 'react';
export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <header style={{ display:'grid', gap:16, marginBottom:'var(--gutter-section)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
        <div style={{ display:'grid', gap:4 }}>
          <h1 style={{ font:'var(--text-h1)', color:'var(--text-strong)' }}>{title}</h1>
          {subtitle && <p style={{ font:'var(--text-body-lg)', color:'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{actions}</div>}
      </div>
      {children}
    </header>
  );
}
