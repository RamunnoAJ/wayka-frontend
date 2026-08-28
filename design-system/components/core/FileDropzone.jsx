import React from 'react';
import { Icon } from './Icon.jsx';
import { Button } from './Button.jsx';
import { FILE_TYPES } from './UploadItem.jsx';

/**
 * Zona de arrastre para web. Degrada a un botón simple donde no hay drag & drop (nativo).
 * @startingPoint section="Core" subtitle="Adjuntos: arrastre, progreso y estados" viewport="760x420"
 */
export function FileDropzone({
  type='foto', maxSizeMB=10, state='idle', rejectedReason, onPick,
  dragDrop=true, title, disabled=false,
}) {
  const t = FILE_TYPES[type] || FILE_TYPES.foto;
  // El límite se lee ANTES de elegir el archivo: el 413 del backend no debe ser una sorpresa.
  const hint = `${t.human} · hasta ${maxSizeMB} MB`;
  const over = state === 'over';
  const rejected = state === 'rejected';

  if (!dragDrop) {
    return (
      <div style={{ display:'grid', gap:8, justifyItems:'stretch' }}>
        <Button block size="touch" variant="secondary" iconLeft={t.icon} onClick={onPick} disabled={disabled}>
          {title || `Elegir ${t.label.toLowerCase()}`}
        </Button>
        <div style={{ font:'var(--fs-caption) var(--font-sans)', textAlign:'center',
          color: rejected ? 'var(--text-danger)' : 'var(--text-subtle)' }}>
          {rejected ? (rejectedReason || 'Ese archivo no se puede adjuntar.') : hint}
        </div>
      </div>
    );
  }

  const border = over ? 'var(--color-primary-fill)' : rejected ? 'var(--danger-500)' : 'var(--border-strong)';
  const bg = over ? 'var(--color-primary-soft)' : rejected ? 'var(--danger-50)' : 'var(--surface-card)';
  return (
    <div aria-disabled={disabled || undefined}
      style={{ display:'grid', gap:10, justifyItems:'center', textAlign:'center', padding:'var(--space-7)',
        border:`1px dashed ${border}`, borderRadius:'var(--radius-card)', background:bg,
        opacity: disabled ? .55 : 1, transition:'var(--transition-control)' }}>
      <span style={{ width:40, height:40, display:'grid', placeItems:'center', borderRadius:'var(--radius-md)',
        background: rejected ? 'var(--danger-100)' : over ? 'var(--surface-card)' : 'var(--neutral-50)',
        color: rejected ? 'var(--danger-500)' : over ? 'var(--color-primary-fill)' : 'var(--text-muted)' }}>
        <Icon name={rejected ? 'file-x' : over ? 'download' : t.icon} size={20} />
      </span>
      <div style={{ font:'var(--text-body-strong)', color: rejected ? 'var(--text-danger)' : 'var(--text-strong)' }}>
        {rejected ? (rejectedReason || 'Ese archivo no se puede adjuntar.')
          : over ? 'Soltá para adjuntar'
          : (title || `Arrastrá ${t.label === 'Foto' ? 'la foto' : 'el archivo'} acá`)}
      </div>
      <div style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)' }}>{hint}</div>
      {!over && <Button size="sm" variant="secondary" onClick={onPick} disabled={disabled}>
        {rejected ? 'Elegir otro archivo' : 'Elegir del disco'}
      </Button>}
    </div>
  );
}
