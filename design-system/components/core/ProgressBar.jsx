import React from 'react';
const H = { sm:4, md:6 };
const TONE = { primary:'var(--color-primary-fill)', success:'var(--success-500)', danger:'var(--danger-500)' };
/** Determinada (value 0-100) o indeterminada, cuando la subida es tan corta que el porcentaje miente. */
export function ProgressBar({ value=0, indeterminate=false, size='md', tone='primary', label, showValue=false }) {
  const h = H[size] || H.md;
  const fill = TONE[tone] || TONE.primary;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ display:'grid', gap:6, width:'100%' }}>
      {(label || showValue) && (
        <div style={{ display:'flex', justifyContent:'space-between', gap:8,
          font:'var(--fs-caption) var(--font-sans)', color:'var(--text-muted)' }}>
          {label && <span>{label}</span>}
          {showValue && !indeterminate && <span style={{ fontVariantNumeric:'tabular-nums' }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuetext={indeterminate ? 'En curso' : undefined}
        style={{ height:h, borderRadius:'var(--radius-pill)', background:'var(--neutral-100)', overflow:'hidden', position:'relative' }}>
        {indeterminate
          ? <span style={{ position:'absolute', top:0, bottom:0, left:0, width:'40%', borderRadius:'var(--radius-pill)',
              background:fill, animation:'wayka-indeterminate 1.2s var(--ease-standard) infinite' }} />
          : <span style={{ display:'block', height:'100%', width:pct+'%', borderRadius:'var(--radius-pill)',
              background:fill, transition:'width var(--dur-normal) var(--ease-standard)' }} />}
      </div>
    </div>
  );
}
