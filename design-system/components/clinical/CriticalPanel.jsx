import React from 'react';
import { Icon } from '../core/Icon.jsx';
/** Bloque de cabecera de la ficha: alergias y medicacion activa, siempre arriba. */
export function CriticalPanel({ kind='allergy', title, items=[], emptyLabel, compact }) {
  const allergy = kind === 'allergy';
  const c = allergy
    ? { bg:'var(--alert-allergy-surface)', bd:'var(--alert-allergy-border)', fg:'var(--alert-allergy-text)', icon:'shield-alert' }
    : { bg:'var(--alert-medication-surface)', bd:'var(--alert-medication-border)', fg:'var(--alert-medication-text)', icon:'pill' };
  const empty = items.length === 0;
  return (
    <section style={{ background: empty ? 'var(--surface-sunken)' : c.bg,
      border:`1px solid ${empty ? 'var(--border-subtle)' : c.bd}`,
      borderRadius:'var(--radius-card)', padding: compact ? 14 : 'var(--gutter-card)' }}>
      <header style={{ display:'flex', alignItems:'center', gap:8, marginBottom: empty ? 0 : 12 }}>
        <Icon name={c.icon} size={17} style={{ color: empty ? 'var(--text-subtle)' : c.fg }} />
        <h3 style={{ font:'var(--fw-bold) var(--fs-overline)/1.2 var(--font-sans)', letterSpacing:'var(--ls-overline)',
          textTransform:'uppercase', color: empty ? 'var(--text-subtle)' : c.fg }}>{title}</h3>
        {!empty && <span style={{ marginLeft:'auto', font:'var(--fw-medium) var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{items.length}</span>}
      </header>
      {empty
        ? <div style={{ font:'var(--text-body)', color:'var(--text-subtle)' }}>{emptyLabel}</div>
        : <div style={{ display:'grid', gap: compact ? 8 : 10 }}>{items}</div>}
    </section>
  );
}
