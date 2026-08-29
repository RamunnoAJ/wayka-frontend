import React from 'react';
import { Icon } from './Icon.jsx';

const TONE = {
  primary:{ bg:'var(--color-primary-fill)', fg:'var(--color-primary-fill-fg)', border:'transparent', hover:'var(--color-primary-fill-hover)', active:'var(--color-primary-fill-hover)' },
  secondary:{ bg:'var(--surface-card)', fg:'var(--text-strong)', border:'var(--border-default)', hover:'var(--surface-hover)', active:'var(--neutral-100)' },
  ghost:{ bg:'transparent', fg:'var(--color-primary-strong)', border:'transparent', hover:'var(--color-primary-soft)', active:'var(--color-primary-soft)' },
  danger:{ bg:'var(--danger-500)', fg:'#fff', border:'transparent', hover:'var(--danger-600)', active:'var(--danger-600)' },
};
TONE.accent = TONE.primary; // deprecado: fusionado con primary
const SIZE = {
  sm:{ h:'var(--control-h-sm)', px:12, fs:'var(--fs-body-sm)', gap:6, icon:16 },
  md:{ h:'var(--control-h-md)', px:16, fs:'var(--fs-body)', gap:8, icon:18 },
  lg:{ h:'var(--control-h-lg)', px:22, fs:'var(--fs-body-lg)', gap:10, icon:20 },
  touch:{ h:'var(--control-h-touch)', px:24, fs:'var(--fs-body-lg)', gap:10, icon:20 },
};

export function Button({ children, variant='primary', size='md', iconLeft, iconRight, block, disabled, loading, ...rest }) {
  const t = TONE[variant] || TONE.primary, s = SIZE[size] || SIZE.md;
  disabled = disabled || loading;
  const [h,setH] = React.useState(false);
  return (
    <button type="button" disabled={disabled}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} {...rest}
      style={{
        display:block?'flex':'inline-flex', width:block?'100%':undefined,
        alignItems:'center', justifyContent:'center', gap:s.gap,
        height:s.h, padding:`0 ${s.px}px`, borderRadius:'var(--radius-control)',
        border:`1px solid ${t.border}`,
        background: disabled ? 'var(--surface-disabled)' : (h ? t.hover : t.bg),
        color: disabled ? 'var(--text-subtle)' : t.fg,
        font:`var(--fw-semibold) ${s.fs}/1 var(--font-sans)`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition:'var(--transition-control)', whiteSpace:'nowrap', ...rest.style,
      }}>
      {loading && <Icon name="loader-circle" size={s.icon} style={{ animation:'wayka-spin .8s linear infinite' }} />}
      {!loading && iconLeft && <Icon name={iconLeft} size={s.icon} />}
      {children}
      {iconRight && <Icon name={iconRight} size={s.icon} />}
    </button>
  );
}
