import React from 'react';
import { Icon } from './Icon.jsx';
import { Button } from './Button.jsx';
import { IconButton } from './IconButton.jsx';
import { ProgressBar } from './ProgressBar.jsx';

/** Tipos que declara la UI al backend. El backend valida el MIME real contra este valor:
 *  el tipo se declara, no se adivina a partir de la extension. */
export const FILE_TYPES = {
  foto:    { icon:'image',      label:'Foto',    accept:'image/jpeg,image/png,image/heic', human:'JPG, PNG o HEIC' },
  pdf:     { icon:'file-text',  label:'PDF',     accept:'application/pdf',                 human:'PDF' },
  estudio: { icon:'microscope', label:'Estudio', accept:'application/pdf,image/jpeg,image/png', human:'PDF o imagen' },
};

/** Un adjunto en curso o terminado. La barra de progreso vive acá adentro. */
export function UploadItem({
  name, size, type='foto', status='listo', progress=0, indeterminate=false,
  errorMessage, owner='mine', ownerName, onRemove, onRetry, removeLabel,
}) {
  const t = FILE_TYPES[type] || FILE_TYPES.foto;
  const failed = status === 'fallo';
  const uploading = status === 'subiendo';
  const mine = owner === 'mine';
  return (
    <div style={{ display:'grid', gap:10, padding:'12px 14px', background:'var(--surface-card)',
      border:'1px solid '+(failed ? 'var(--border-danger)' : 'var(--border-default)'),
      borderRadius:'var(--radius-md)' }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <span style={{ width:36, height:36, flex:'0 0 auto', display:'grid', placeItems:'center', borderRadius:'var(--radius-sm)',
          background: failed ? 'var(--danger-50)' : 'var(--neutral-50)',
          color: failed ? 'var(--danger-500)' : 'var(--text-muted)' }}>
          <Icon name={failed ? 'alert-circle' : t.icon} size={18} />
        </span>
        <div style={{ flex:1, minWidth:0, display:'grid', gap:2 }}>
          <div style={{ font:'var(--text-body-strong)', color:'var(--text-strong)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
          <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap',
            font:'var(--fs-caption) var(--font-sans)',
            color: failed ? 'var(--text-danger)' : 'var(--text-muted)' }}>
            <span>{t.label}</span>
            {size && <><span aria-hidden="true">·</span><span style={{ fontVariantNumeric:'tabular-nums' }}>{size}</span></>}
            {status === 'listo' && <><span aria-hidden="true">·</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:'var(--text-success)' }}>
                <Icon name="check" size={12} />Listo</span></>}
            {uploading && <><span aria-hidden="true">·</span><span>Subiendo</span></>}
            {failed && errorMessage && <><span aria-hidden="true">·</span><span>{errorMessage}</span></>}
          </div>
          {/* Adjunto de otro rol: se distingue por la autoria, NO por el color ni por opacidad —
              bajarle contraste lo haría leer como deshabilitado por error. */}
          {!mine && ownerName && (
            <div style={{ font:'var(--fs-caption) var(--font-sans)', color:'var(--text-subtle)', marginTop:1 }}>
              Subido por {ownerName}
            </div>
          )}
        </div>
        {/* Cada rol retira solo lo que subió. Un adjunto no se edita: se retira y se sube otro. */}
        {mine && onRemove && !failed && (
          <IconButton icon={uploading ? 'x' : 'trash-2'} size="sm" variant="ghost" onClick={onRemove}
            label={removeLabel || (uploading ? 'Cancelar la subida' : 'Retirar el adjunto')} />
        )}
      </div>
      {uploading && <ProgressBar value={progress} indeterminate={indeterminate} size="sm" />}
      {failed && (
        <div style={{ display:'flex', gap:8 }}>
          {onRetry && <Button size="sm" variant="secondary" iconLeft="rotate-ccw" onClick={onRetry}>Reintentar</Button>}
          {mine && onRemove && <Button size="sm" variant="ghost" onClick={onRemove}>Descartar</Button>}
        </div>
      )}
    </div>
  );
}
