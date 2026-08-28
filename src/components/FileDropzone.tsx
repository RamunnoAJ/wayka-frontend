import { Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { TIPOS_DE_ARCHIVO, type TipoDeArchivo } from './UploadItem';

/**
 * Port a React Native de `design-system/components/core/FileDropzone.jsx`.
 *
 * Punto de entrada del adjunto. **Una zona por tipo**: el tipo se declara al
 * backend, no se infiere de la extensión, así que no existe una zona genérica.
 *
 * Dos diferencias con el original, las dos por la plataforma:
 *
 * 1. `dragDrop` no arranca en `true` sino en "hay drag & drop acá": en iOS y
 *    Android no lo hay y la zona degrada sola al botón táctil. Pasarlo explícito
 *    sigue valiendo y gana.
 * 2. El estado `over` es **controlado**, igual que en el design system: este
 *    componente no escucha eventos de arrastre. Quien lo use en web engancha los
 *    eventos del DOM y le pasa `state`; en nativo ese estado no ocurre nunca.
 */
type EstadoDeZona = 'idle' | 'over' | 'rejected';

interface FileDropzoneProps {
  /** Tipo DECLARADO al backend. */
  type?: TipoDeArchivo;
  /** Límite del backend (413). Se muestra siempre, **antes** de elegir el archivo. */
  maxSizeMB?: number;
  state?: EstadoDeZona;
  /** Motivo concreto del rechazo. */
  rejectedReason?: string;
  /** Abre el selector de archivos. */
  onPick?: () => void;
  /** `false` fuerza la degradación a botón. Por defecto, solo hay arrastre en web. */
  dragDrop?: boolean;
  /** Reemplaza el texto principal en reposo. */
  title?: string;
  disabled?: boolean;
}

export function FileDropzone({
  type = 'foto',
  maxSizeMB = 10,
  state = 'idle',
  rejectedReason,
  onPick,
  dragDrop = Platform.OS === 'web',
  title,
  disabled = false,
}: FileDropzoneProps) {
  const { t, px, texto } = useTheme();

  const tipo = TIPOS_DE_ARCHIVO[type];
  // El límite se lee ANTES de elegir el archivo: el 413 del backend no puede
  // ser el primer aviso.
  const pista = `${tipo.humano} · hasta ${maxSizeMB} MB`;
  const encima = state === 'over';
  const rechazado = state === 'rejected';
  const motivo = rejectedReason ?? 'Ese archivo no se puede adjuntar.';

  if (!dragDrop) {
    return (
      <View style={estilos.degradada}>
        <Button
          block
          size="touch"
          variant="secondary"
          iconLeft={tipo.icono}
          onPress={onPick}
          disabled={disabled}
        >
          {title ?? `Elegir ${tipo.etiqueta.toLowerCase()}`}
        </Button>
        <Text
          style={[
            texto('caption'),
            estilos.centrado,
            { color: rechazado ? t['--text-danger'] : t['--text-subtle'] },
          ]}
        >
          {rechazado ? motivo : pista}
        </Text>
      </View>
    );
  }

  const borde = encima
    ? t['--color-primary-fill']
    : rechazado
      ? t['--danger-500']
      : t['--border-strong'];
  const fondo = encima
    ? t['--color-primary-soft']
    : rechazado
      ? t['--danger-50']
      : t['--surface-card'];

  return (
    <View
      accessibilityState={{ disabled }}
      style={[
        estilos.zona,
        {
          padding: px('--space-7'),
          borderColor: borde,
          borderRadius: px('--radius-card'),
          backgroundColor: fondo,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      <View
        style={[
          estilos.icono,
          {
            borderRadius: px('--radius-md'),
            backgroundColor: rechazado
              ? t['--danger-100']
              : encima
                ? t['--surface-card']
                : t['--neutral-50'],
          },
        ]}
      >
        <Icon
          name={rechazado ? 'file-x' : encima ? 'download' : tipo.icono}
          size={20}
          color={
            rechazado ? t['--danger-500'] : encima ? t['--color-primary-fill'] : t['--text-muted']
          }
        />
      </View>

      <Text
        style={[
          texto('body-strong'),
          estilos.centrado,
          { color: rechazado ? t['--text-danger'] : t['--text-strong'] },
        ]}
      >
        {rechazado
          ? motivo
          : encima
            ? 'Soltá para adjuntar'
            : (title ?? `Arrastrá ${type === 'foto' ? 'la foto' : 'el archivo'} acá`)}
      </Text>

      <Text style={[texto('caption'), estilos.centrado, { color: t['--text-subtle'] }]}>
        {pista}
      </Text>

      {!encima ? (
        <Button size="sm" variant="secondary" onPress={onPick} disabled={disabled}>
          {rechazado ? 'Elegir otro archivo' : 'Elegir del disco'}
        </Button>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  degradada: { gap: 8, alignSelf: 'stretch' },
  centrado: { textAlign: 'center' },
  zona: { alignItems: 'center', gap: 10, borderWidth: 1, borderStyle: 'dashed' },
  icono: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
