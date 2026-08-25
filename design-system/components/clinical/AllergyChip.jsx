import React from 'react';
export function AllergyChip({ label, severity='alta' }) {
  const high = severity === 'alta';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 11px',
      borderRadius:'var(--radius-pill)', background:'var(--alert-allergy-surface)',
      color:'var(--alert-allergy-text)', border:'1px solid var(--alert-allergy-border)',
      font:`${high?'var(--fw-semibold)':'var(--fw-medium)'} var(--fs-body-sm)/1.3 var(--font-sans)` }}>
      <span style={{ width:6, height:6, borderRadius:'50%', flex:'0 0 6px',
        background: high ? 'var(--danger-500)' : 'var(--danger-100)' }} />
      {label}
    </span>
  );
}
