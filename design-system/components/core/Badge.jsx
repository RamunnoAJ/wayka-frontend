import React from 'react';
import { Icon } from './Icon.jsx';
// Sobrio: un solo fondo neutro; el significado lo lleva un punto de color apagado + texto.
const DOT = {
  neutral:'var(--neutral-400)',
  primary:'var(--color-primary-strong)',
  success:'var(--success-500)',
  warning:'var(--warning-500)',
  danger:'var(--danger-500)',
  info:'var(--info-500)',
};
DOT.brand = DOT.primary; DOT.accent = DOT.primary; // deprecados
export function Badge({ children, tone='neutral', icon, solid, size='md' }) {
  const dot = DOT[tone] || DOT.neutral;
  const strong = tone === 'danger'; // solo el riesgo real sube el contraste del texto
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6,
      padding: size==='sm' ? '2px 8px' : '4px 10px', borderRadius:'var(--radius-pill)',
      background:'var(--surface-sunken)', border:'1px solid var(--border-subtle)',
      color: strong ? 'var(--text-danger)' : 'var(--text-muted)',
      font:'var(--fw-semibold) ' + (size==='sm'?'var(--fs-overline)':'var(--fs-caption)') + '/1.4 var(--font-sans)' }}>
      {icon
        ? <Icon name={icon} size={size==='sm'?11:13} style={{ color:dot }} />
        : <span style={{ width:6, height:6, borderRadius:'50%', background:dot, flex:'0 0 auto' }} />}
      {children}
    </span>
  );
}
