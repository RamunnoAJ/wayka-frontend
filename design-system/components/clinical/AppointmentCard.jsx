import React from 'react';
const ST = {
  pendiente:['var(--appt-pending)','var(--appt-pending-surface)','Pendiente','clock'],
  cumplido:['var(--appt-done)','var(--appt-done-surface)','Cumplido','check'],
  vencido:['var(--appt-overdue)','var(--appt-overdue-surface)','Vencido','alert-circle'],
};
export function AppointmentCard({ status='pendiente', time, title, patient, vet, actions, compact }) {
  const [c,,label] = ST[status] || ST.pendiente;
  return (
    <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:'var(--surface-card)',
      border:'1px solid var(--border-subtle)', borderLeft:`3px solid ${c}`,
      borderRadius:'var(--radius-md)', padding: compact ? '10px 12px' : '14px 16px' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ font:'var(--fw-bold) var(--fs-body-sm) var(--font-sans)', color:'var(--text-strong)', fontVariantNumeric:'tabular-nums' }}>{time}</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5,
            color: status==='vencido' ? c : 'var(--text-subtle)', font:'var(--fw-semibold) var(--fs-overline)/1.4 var(--font-sans)',
            letterSpacing:'var(--ls-overline)', textTransform:'uppercase' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:c }} />{label}
          </span>
        </div>
        <div style={{ font:'var(--text-body-strong)', color:'var(--text-strong)', marginTop:4 }}>{title}</div>
        <div style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)', marginTop:2 }}>
          {[patient, vet].filter(Boolean).join(' · ')}
        </div>
      </div>
      {actions}
    </div>
  );
}
