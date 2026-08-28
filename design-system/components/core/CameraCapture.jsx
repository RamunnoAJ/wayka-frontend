import React from 'react';
import { Icon } from './Icon.jsx';

/**
 * Cámara en pantalla: visor a sangre, controles flotantes y revisión de la toma.
 * Vive dentro de la app (no es el picker del sistema) porque la foto clínica necesita guía de encuadre.
 * @startingPoint section="Core" subtitle="Cámara en pantalla: visor, modos y revisión" viewport="420x760"
 */

export const CAMERA_MODES = {
  foto: { label: 'Foto', icon: 'camera', hint: 'Acercate y evitá el contraluz.' },
  documento: { label: 'Documento', icon: 'scan-line', hint: 'Apoyá la ficha en una superficie plana.' },
};

const FLASH = { off: { icon: 'zap-off', label: 'Flash apagado' }, on: { icon: 'zap', label: 'Flash encendido' }, auto: { icon: 'zap', label: 'Flash automático' } };
const FLASH_ORDER = ['off', 'auto', 'on'];

function Chip({ icon, label, onClick, active, size = 44 }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: size, height: size, display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-pill)',
        border: '1px solid ' + (active ? 'var(--nav-accent)' : 'var(--border-on-nav)'),
        background: active ? 'var(--nav-accent)' : h ? 'var(--surface-nav-item)' : 'var(--surface-nav-item-hover)',
        color: active ? 'var(--wayka-oscuro)' : 'var(--text-on-nav)', cursor: 'pointer',
        backdropFilter: 'blur(8px)', transition: 'var(--transition-control)' }}>
      <Icon name={icon} size={20} />
    </button>
  );
}

/** Marco de encuadre: solo esquinas, en el acento de la nav. No es una caja: no encierra la imagen. */
function FrameGuide({ ratio }) {
  const corner = { position: 'absolute', width: 26, height: 26, borderColor: 'var(--nav-accent)', borderStyle: 'solid', borderWidth: 0 };
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
      <div style={{ position: 'relative', width: '82%', aspectRatio: ratio, maxHeight: '68%' }}>
        <span style={{ ...corner, top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 'var(--radius-sm)' }} />
        <span style={{ ...corner, top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 'var(--radius-sm)' }} />
        <span style={{ ...corner, bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 'var(--radius-sm)' }} />
        <span style={{ ...corner, bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 'var(--radius-sm)' }} />
      </div>
    </div>
  );
}

export function CameraCapture({
  status = 'listo', mode = 'foto', modes = ['foto', 'documento'],
  flash = 'off', title, hint, previewSrc, galleryThumb, galleryCount,
  confirmLabel = 'Usar', retakeLabel = 'Repetir',
  deniedTitle = 'Wayka no tiene acceso a la cámara',
  deniedBody = 'Sin cámara podés adjuntar fotos que ya tengas en el teléfono, pero no tomar una nueva desde acá.',
  framed = true, onCapture, onRetake, onConfirm, onClose, onFlip, onGallery,
  onModeChange, onFlashChange, onOpenSettings, ...rest
}) {
  const m = CAMERA_MODES[mode] || CAMERA_MODES.foto;
  const reviewing = status === 'revisando' || status === 'procesando';
  const busy = status === 'procesando';
  const denied = status === 'sin-permiso';
  const f = FLASH[flash] || FLASH.off;
  const cycleFlash = () => onFlashChange && onFlashChange(FLASH_ORDER[(FLASH_ORDER.indexOf(flash) + 1) % FLASH_ORDER.length]);

  const scrim = (dir) => ({ position: 'absolute', left: 0, right: 0, [dir]: 0, height: 148, pointerEvents: 'none',
    background: `linear-gradient(to ${dir === 'top' ? 'bottom' : 'top'}, var(--surface-nav-deep), transparent)`, opacity: .9 });

  return (
    <div data-surface="dark" {...rest}
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 520, overflow: 'hidden',
        borderRadius: framed ? 'var(--radius-card)' : 0, background: 'var(--surface-nav-deep)',
        color: 'var(--text-on-nav)', font: 'var(--text-body)', ...rest.style }}>

      {/* Visor: la imagen viva la aporta el consumidor (RN Camera / <video>); acá entra por previewSrc. */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--wayka-oscuro)' }}>
        {previewSrc
          ? <img src={previewSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: busy ? 'brightness(.7)' : 'none' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-on-nav-muted)',
              font: 'var(--fw-medium) var(--fs-caption)/1 var(--font-sans)', letterSpacing: 'var(--ls-overline)', textTransform: 'uppercase' }}>Visor</div>}
      </div>

      {!denied && !reviewing && mode === 'documento' && <FrameGuide ratio="1 / 1.35" />}
      <div style={scrim('top')} />
      <div style={scrim('bottom')} />

      <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateRows: 'auto 1fr auto', padding: 'var(--gutter-mobile)', gap: 'var(--space-4)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <Chip icon="x" label="Cerrar la cámara" onClick={onClose} />
          {title && <div style={{ font: 'var(--fw-semibold) var(--fs-body-sm)/1 var(--font-sans)', color: 'var(--text-on-nav)', textAlign: 'center', flex: 1 }}>{title}</div>}
          {!denied && !reviewing
            ? <Chip icon={f.icon} label={f.label} active={flash !== 'off'} onClick={cycleFlash} />
            : <span style={{ width: 44 }} />}
        </div>

        {denied
          ? <div style={{ alignSelf: 'center', justifySelf: 'center', maxWidth: 320, display: 'grid', gap: 'var(--space-4)', justifyItems: 'center', textAlign: 'center',
              padding: 'var(--space-7)', borderRadius: 'var(--radius-card)', background: 'var(--surface-nav-item)', border: '1px solid var(--border-on-nav)', backdropFilter: 'blur(10px)' }}>
              <Icon name="camera-off" size={24} style={{ color: 'var(--text-on-nav-muted)' }} />
              <div style={{ font: 'var(--fw-semibold) var(--fs-body-lg)/var(--lh-snug) var(--font-sans)' }}>{deniedTitle}</div>
              <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-on-nav-muted)', textWrap: 'pretty' }}>{deniedBody}</div>
              {onOpenSettings && <button type="button" onClick={onOpenSettings}
                style={{ background: 'none', border: 0, padding: 'var(--space-2) 0', cursor: 'pointer',
                  font: 'var(--fw-semibold) var(--fs-body)/1 var(--font-sans)', color: 'var(--nav-accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Abrir ajustes del teléfono</button>}
            </div>
          : <span />}

        {!denied && <div style={{ display: 'grid', gap: 'var(--space-5)', justifyItems: 'center' }}>
          {(hint || (!reviewing && m.hint)) && <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-on-nav-muted)', textAlign: 'center', textWrap: 'pretty' }}>
            {busy ? 'Guardando la toma…' : reviewing ? (hint || '') : (hint || m.hint)}</div>}

          {!reviewing && modes.length > 1 && (
            <div role="tablist" style={{ display: 'flex', gap: 'var(--space-1)', padding: 3, borderRadius: 'var(--radius-pill)',
              background: 'var(--surface-nav-item-hover)', border: '1px solid var(--border-on-nav)', backdropFilter: 'blur(8px)' }}>
              {modes.map((k) => {
                const on = k === mode; const item = CAMERA_MODES[k] || CAMERA_MODES.foto;
                return <button key={k} type="button" role="tab" aria-selected={on} onClick={() => onModeChange && onModeChange(k)}
                  style={{ border: 0, cursor: 'pointer', padding: '0 var(--space-5)', height: 32, borderRadius: 'var(--radius-pill)',
                    background: on ? 'var(--nav-accent)' : 'transparent', color: on ? 'var(--wayka-oscuro)' : 'var(--text-on-nav-muted)',
                    font: 'var(--fw-semibold) var(--fs-body-sm)/1 var(--font-sans)', transition: 'var(--transition-control)' }}>{item.label}</button>;
              })}
            </div>
          )}

          {reviewing
            ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', width: '100%' }}>
                <button type="button" onClick={onRetake} disabled={busy}
                  style={{ height: 'var(--control-h-touch)', borderRadius: 'var(--radius-control)', cursor: busy ? 'not-allowed' : 'pointer',
                    background: 'var(--surface-nav-item)', border: '1px solid var(--border-on-nav)', color: 'var(--text-on-nav)',
                    font: 'var(--fw-semibold) var(--fs-body-lg)/1 var(--font-sans)', backdropFilter: 'blur(8px)' }}>{retakeLabel}</button>
                <button type="button" onClick={onConfirm} disabled={busy}
                  style={{ height: 'var(--control-h-touch)', borderRadius: 'var(--radius-control)', cursor: busy ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)',
                    background: 'var(--nav-accent)', border: '1px solid var(--nav-accent)', color: 'var(--wayka-oscuro)',
                    font: 'var(--fw-semibold) var(--fs-body-lg)/1 var(--font-sans)' }}>
                  {busy && <Icon name="loader-circle" size={18} style={{ animation: 'wayka-spin .8s linear infinite' }} />}
                  {busy ? 'Guardando' : confirmLabel}</button>
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px', alignItems: 'center', width: '100%' }}>
                {onGallery
                  ? <button type="button" aria-label="Elegir del carrete" onClick={onGallery}
                      style={{ width: 44, height: 44, padding: 0, borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        border: '1px solid var(--border-on-nav)', background: 'var(--surface-nav-item)', color: 'var(--text-on-nav)',
                        display: 'grid', placeItems: 'center', position: 'relative' }}>
                      {/* El recorte vive en el hueco interno: el contador sobresale del botón sin cortarse. */}
                      <span style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                        {galleryThumb ? <img src={galleryThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="images" size={18} />}
                      </span>
                      {galleryCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 5px',
                        borderRadius: 'var(--radius-pill)', background: 'var(--nav-accent)', color: 'var(--wayka-oscuro)',
                        font: 'var(--fw-bold) var(--fs-overline)/18px var(--font-sans)' }}>{galleryCount}</span>}
                    </button>
                  : <span />}
                <span style={{ justifySelf: 'center' }}>
                  <button type="button" aria-label={`Tomar ${m.label.toLowerCase()}`} onClick={onCapture}
                    style={{ width: 76, height: 76, borderRadius: 'var(--radius-pill)', cursor: 'pointer', padding: 5,
                      background: 'transparent', border: '2px solid var(--border-on-nav)', display: 'grid', placeItems: 'center' }}>
                    <span style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-pill)', background: 'var(--wayka-blanco)', display: 'block' }} />
                  </button>
                </span>
                {onFlip ? <Chip icon="refresh-cw" label="Cambiar de cámara" onClick={onFlip} /> : <span />}
              </div>}
        </div>}
      </div>
    </div>
  );
}
