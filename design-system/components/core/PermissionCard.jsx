import React from 'react';
import { Icon } from './Icon.jsx';
import { Button } from './Button.jsx';

const DEFAULTS = {
  'sin-preguntar': {
    title: 'Activá los avisos',
    body: 'Te avisamos el día anterior a cada turno y cuando tu veterinaria carga algo nuevo en la ficha.',
  },
  concedido: {
    title: 'Avisos activados',
    body: 'Recibís el recordatorio del día anterior a cada turno.',
  },
  denegado: {
    title: 'Los avisos están desactivados',
    // La consecuencia concreta, sin alarmismo: el SO no vuelve a preguntar, la app no puede insistir.
    body: 'Mientras estén desactivados en tu teléfono no vas a recibir el recordatorio del día anterior a cada turno.',
  },
};

/** Pide el permiso de push y muestra el estado ya resuelto. */
export function PermissionCard({ status='sin-preguntar', title, body, onAsk, onOpenSettings, onDismiss,
  askLabel='Permitir avisos', dismissLabel='Más tarde', settingsLabel='Abrir ajustes del teléfono' }) {
  const d = DEFAULTS[status] || DEFAULTS['sin-preguntar'];
  const t = title || d.title;
  const b = body || d.body;

  // Concedido: una línea, sin acción. Nada que decidir, nada que ocupar.
  if (status === 'concedido') {
    return (
      <div style={{ display:'flex', gap:9, alignItems:'center', padding:'10px 12px',
        borderRadius:'var(--radius-md)', background:'var(--success-50)', border:'1px solid var(--success-100)' }}>
        <Icon name="bell" size={15} style={{ color:'var(--text-success)' }} />
        <span style={{ font:'var(--text-body-strong)', color:'var(--text-success)' }}>{t}</span>
      </div>
    );
  }

  // Denegado: discreto y a la altura de un dato, no un banner. Neutro, no rojo: el usuario no cometió un error.
  if (status === 'denegado') {
    return (
      <div style={{ display:'grid', gap:8, padding:'12px 14px', borderRadius:'var(--radius-md)',
        background:'var(--surface-sunken)', border:'1px solid var(--border-subtle)' }}>
        <div style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
          <Icon name="bell-off" size={15} style={{ color:'var(--text-subtle)', marginTop:2 }} />
          <div style={{ display:'grid', gap:3 }}>
            <span style={{ font:'var(--text-body-strong)', color:'var(--text-body)' }}>{t}</span>
            <span style={{ font:'var(--fs-body-sm)/1.5 var(--font-sans)', color:'var(--text-muted)' }}>{b}</span>
          </div>
        </div>
        {onOpenSettings && (
          <div style={{ paddingLeft:24 }}>
            <Button size="sm" variant="ghost" iconRight="external-link" onClick={onOpenSettings}>{settingsLabel}</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display:'grid', gap:14, padding:'16px', borderRadius:'var(--radius-card)',
      background:'var(--surface-card)', border:'1px solid var(--border-default)' }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <span style={{ width:36, height:36, flex:'0 0 auto', display:'grid', placeItems:'center',
          borderRadius:'var(--radius-md)', background:'var(--color-primary-soft)', color:'var(--color-primary-strong)' }}>
          <Icon name="bell" size={18} />
        </span>
        <div style={{ display:'grid', gap:4 }}>
          <span style={{ font:'var(--text-h4)', color:'var(--text-strong)' }}>{t}</span>
          <span style={{ font:'var(--text-body)', color:'var(--text-muted)' }}>{b}</span>
        </div>
      </div>
      <div style={{ display:'grid', gap:8 }}>
        {onAsk && <Button block size="touch" onClick={onAsk}>{askLabel}</Button>}
        {onDismiss && <Button block size="sm" variant="ghost" onClick={onDismiss}>{dismissLabel}</Button>}
      </div>
    </div>
  );
}
