import React from 'react';
import { Icon } from '../core/Icon.jsx';
/** Muestra un dato distinguiendo autoria (clinico vs tutor) y si es editable. */
export function DataField({ label, value, source='clinical', editable=false, onEdit, unit }) {
  const clinical = source === 'clinical';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border-subtle)' }}>
      <div style={{ flex:'0 0 40%', display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', flex:'0 0 auto',
          background: clinical ? 'var(--clinical-accent)' : 'var(--owner-accent)' }} />
        <span style={{ font:'var(--text-body)', color:'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ flex:1, font:'var(--text-body-strong)', color:'var(--text-strong)', fontVariantNumeric:'tabular-nums' }}>
        {value}{unit && <span style={{ font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}> {unit}</span>}
      </div>
      {editable
        ? <button type="button" onClick={onEdit} style={{ display:'inline-flex', alignItems:'center', gap:5, border:0, background:'transparent',
            cursor:'pointer', color:'var(--owner-accent)', font:'var(--fw-semibold) var(--fs-caption) var(--font-sans)' }}>
            <Icon name="pencil" size={13} />Editar
          </button>
        : <span title="Solo lectura" style={{ display:'inline-flex', alignItems:'center', gap:5, color:'var(--text-subtle)',
            font:'var(--fw-medium) var(--fs-caption) var(--font-sans)' }}>
            <Icon name="lock" size={12} />Solo lectura
          </span>}
    </div>
  );
}
