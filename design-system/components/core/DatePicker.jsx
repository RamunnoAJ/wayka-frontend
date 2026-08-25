import React from 'react';
import { Icon } from './Icon.jsx';
import { IconButton } from './IconButton.jsx';
const DIAS = ['L','M','X','J','V','S','D'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const iso = d => d.toISOString().slice(0,10);
const parse = v => { const d = v ? new Date(v + 'T00:00:00') : new Date(); return isNaN(d) ? new Date() : d; };
const fmt = d => `${d.getDate()} ${MESES[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;

/** Calendario de un mes. Sin dependencias: value/onChange en ISO "YYYY-MM-DD". */
export function Calendar({ value, onChange, min }) {
  const sel = value ? parse(value) : null;
  const [cur, setCur] = React.useState(() => parse(value));
  const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
  const today = iso(new Date());
  const move = n => setCur(new Date(cur.getFullYear(), cur.getMonth() + n, 1));
  return (
    <div style={{ width:266, display:'grid', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <IconButton icon="chevron-left" label="Mes anterior" size="sm" onClick={()=>move(-1)} />
        <span style={{ font:'var(--fw-semibold) var(--fs-body) var(--font-sans)', color:'var(--text-strong)' }}>
          {MESES[cur.getMonth()]} {cur.getFullYear()}
        </span>
        <IconButton icon="chevron-right" label="Mes siguiente" size="sm" onClick={()=>move(1)} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {DIAS.map((d,i) => <span key={i} style={{ textAlign:'center', padding:'2px 0',
          font:'var(--fw-semibold) var(--fs-overline) var(--font-sans)', color:'var(--text-subtle)' }}>{d}</span>)}
        {Array.from({ length: offset }).map((_,i) => <span key={'e'+i} />)}
        {Array.from({ length: days }).map((_,i) => {
          const d = new Date(cur.getFullYear(), cur.getMonth(), i + 1), v = iso(d);
          const on = sel && v === iso(sel), isToday = v === today, off = min && v < min;
          return (
            <button key={v} type="button" disabled={off} onClick={()=>onChange && onChange(v)}
              style={{ height:34, border:0, cursor: off ? 'not-allowed' : 'pointer',
                borderRadius:'var(--radius-sm)',
                background: on ? 'var(--color-primary-fill)' : 'transparent',
                color: off ? 'var(--text-subtle)' : on ? '#fff' : 'var(--text-body)',
                font:`${on || isToday ? 'var(--fw-semibold)' : 'var(--fw-regular)'} var(--fs-body-sm) var(--font-sans)`,
                boxShadow: !on && isToday ? 'inset 0 0 0 1px var(--border-default)' : 'none',
                transition:'var(--transition-control)' }}>{i + 1}</button>
          );
        })}
      </div>
    </div>
  );
}

/** Campo de fecha con calendario desplegable. */
export function DatePicker({ label, value, onChange, hint, min, placeholder='Elegir fecha' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ display:'grid', gap:6, position:'relative' }}>
      {label && <span style={{ font:'var(--text-caption)', color:'var(--text-muted)' }}>{label}</span>}
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{ display:'flex', alignItems:'center', gap:8, width:'100%',
          height:'var(--control-h-md)', padding:'0 12px', borderRadius:'var(--radius-control)',
          border:'1px solid '+(open ? 'var(--border-focus)' : 'var(--border-default)'),
          background:'var(--surface-card)', cursor:'pointer',
          font:'var(--text-body)', color: value ? 'var(--text-strong)' : 'var(--text-subtle)',
          transition:'var(--transition-control)' }}>
        <Icon name="calendar" size={16} style={{ color:'var(--text-subtle)' }} />
        {value ? fmt(parse(value)) : placeholder}
      </button>
      {hint && <span style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{hint}</span>}
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, marginTop:6, zIndex:40,
          background:'var(--surface-card)', border:'1px solid var(--border-subtle)',
          borderRadius:'var(--radius-md)', boxShadow:'var(--shadow-lg)', padding:12 }}>
          <Calendar value={value} min={min} onChange={v => { onChange && onChange(v); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}
