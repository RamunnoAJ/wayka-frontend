import React from 'react';
/* Estilos por estado: pendiente en tinte lila, cumplido en neutro, vencido en tinte rojo.
   El tinte ES el estado — sin barras laterales ni iconos. */
const EV = {
  pendiente:{ bg:'var(--appt-pending-surface)', fg:'var(--color-primary-strong)', time:'var(--color-primary-strong)', timeOp:.72 },
  cumplido:{ bg:'var(--surface-sunken)', fg:'var(--text-strong)', time:'var(--text-muted)', timeOp:1 },
  vencido:{ bg:'var(--appt-overdue-surface)', fg:'var(--appt-overdue)', time:'var(--appt-overdue)', timeOp:.78 },
};
/** Bloque de cita dentro de una celda de calendario. */
export function CalendarEvent({ title, time, status='pendiente', onClick }) {
  const s = EV[status] || EV.pendiente;
  return (
    <button type="button" onClick={onClick} style={{ display:'block', width:'100%', textAlign:'left',
      border:0, cursor: onClick ? 'pointer' : 'default', borderRadius:'var(--radius-sm)',
      padding:'8px 10px', background:s.bg,
      font:'var(--fw-semibold) var(--fs-body-sm)/1.35 var(--font-sans)', color:s.fg,
      transition:'var(--transition-control)' }}>
      {title}
      {time && <span style={{ display:'block', marginTop:2, opacity:s.timeOp,
        font:'var(--fw-medium) var(--fs-caption)/1.3 var(--font-sans)',
        fontVariantNumeric:'tabular-nums' }}>{time}</span>}
    </button>
  );
}
const DOW = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
/** Semana en columnas por dia, sin franjas horarias: las citas se apilan en orden.
 *  days: [{ date, dow?, today?, events:[{ title, time, status }] }] — 7 entradas. */
export function CalendarWeek({ days=[], onEventClick, minHeight=260 }) {
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'var(--surface-sunken)' }}>
        {days.map((d,i) => (
          <div key={i} style={{ padding:'11px 10px', textAlign:'center',
            font:'var(--fw-semibold) var(--fs-body-sm) var(--font-sans)', color:'var(--text-muted)' }}>
            {d.dow || DOW[i % 7]}
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
        {days.map((d,i) => (
          <div key={i} style={{ minHeight, padding:'10px 8px',
            borderTop:'1px solid var(--border-subtle)',
            borderLeft: i ? '1px solid var(--border-subtle)' : 'none',
            display:'flex', flexDirection:'column', gap:8 }}>
            <span style={{ alignSelf:'flex-start', minWidth:26, height:26, display:'inline-grid', placeItems:'center',
              padding:'0 6px', borderRadius:'var(--radius-pill)',
              background: d.today ? 'var(--color-primary-fill)' : 'transparent',
              font:'var(--fw-semibold) var(--fs-body) var(--font-sans)', fontVariantNumeric:'tabular-nums',
              color: d.today ? 'var(--color-primary-fill-fg)' : 'var(--text-strong)' }}>{d.date}</span>
            {(d.events || []).map((e,j) => (
              <CalendarEvent key={j} {...e} onClick={onEventClick ? () => onEventClick(e, d) : undefined} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
