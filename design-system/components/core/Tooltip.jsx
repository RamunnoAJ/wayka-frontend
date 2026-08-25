import React from 'react';
export function Tooltip({ label, children, side='top' }) {
  const [on,setOn]=React.useState(false);
  const pos = side==='top' ? { bottom:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)' }
    : { top:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)' };
  return (
    <span style={{ position:'relative', display:'inline-flex' }}
      onMouseEnter={()=>setOn(true)} onMouseLeave={()=>setOn(false)} onFocus={()=>setOn(true)} onBlur={()=>setOn(false)}>
      {children}
      {on && <span role="tooltip" style={{ position:'absolute', ...pos, zIndex:40, whiteSpace:'nowrap',
        background:'var(--wayka-oscuro)', color:'#fff', padding:'6px 10px', borderRadius:'var(--radius-sm)',
        font:'var(--fw-medium) var(--fs-caption)/1.3 var(--font-sans)', boxShadow:'var(--shadow-md)' }}>{label}</span>}
    </span>
  );
}
