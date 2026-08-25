import React from 'react';
const C = { pendiente:'var(--appt-pending)', cumplido:'var(--appt-done)', vencido:'var(--appt-overdue)', activo:'var(--success-500)', inactivo:'var(--neutral-300)' };
export function StatusDot({ status='pendiente', label, size=8 }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:7, font:'var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>
      <span style={{ width:size, height:size, borderRadius:'50%', background:C[status] || C.inactivo, flex:'0 0 auto' }} />
      {label}
    </span>
  );
}
