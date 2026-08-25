import React from 'react';
/** Bloque de carga. Usar con las mismas medidas que el contenido que reemplaza. */
export function Skeleton({ width='100%', height=14, radius='var(--radius-sm)', circle=false, style }) {
  const size = circle ? { width: height, height, borderRadius:'50%' } : { width, height, borderRadius: radius };
  return (
    <span aria-hidden="true" style={{ display:'block', flex:'0 0 auto',
      background:'var(--surface-sunken)', position:'relative', overflow:'hidden',
      ...size, ...style }}>
      <span style={{ position:'absolute', inset:0,
        background:'linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent)',
        animation:'wayka-shimmer 1.4s var(--ease-standard) infinite' }} />
    </span>
  );
}
/** Varias lineas de texto; la ultima sale mas corta. */
export function SkeletonText({ lines=3, gap=8 }) {
  return (
    <div style={{ display:'grid', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '62%' : '100%'} />
      ))}
    </div>
  );
}
