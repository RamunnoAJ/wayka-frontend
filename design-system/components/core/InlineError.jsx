import React from 'react';
import { Icon } from './Icon.jsx';
import { Button } from './Button.jsx';
/** Error dentro de un bloque que no pudo cargar. Para avisos efimeros usar Toast. */
export function InlineError({ title='No pudimos cargar esto', description, onRetry, retryLabel='Reintentar', compact=false }) {
  return (
    <div role="alert" style={{ display:'grid', justifyItems: compact ? 'start' : 'center', gap:6,
      textAlign: compact ? 'left' : 'center', padding: compact ? '12px 0' : 'var(--space-9) var(--space-7)' }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:7, color:'var(--text-danger)',
        font:'var(--fw-semibold) var(--fs-body) var(--font-sans)' }}>
        <Icon name="alert-circle" size={16} />{title}
      </span>
      {description && <p style={{ font:'var(--text-body)', color:'var(--text-muted)', maxWidth:340 }}>{description}</p>}
      {onRetry && <div style={{ marginTop:4 }}>
        <Button size="sm" variant="secondary" iconLeft="rotate-ccw" onClick={onRetry}>{retryLabel}</Button>
      </div>}
    </div>
  );
}
