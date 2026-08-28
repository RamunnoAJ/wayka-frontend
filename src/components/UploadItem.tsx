import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

import { Button } from './Button';
import { Icon, type NombreDeIcono } from './Icon';
import { IconButton } from './IconButton';
import { ProgressBar } from './ProgressBar';

/**
 * Port a React Native de `design-system/components/core/UploadItem.jsx`.
 *
 * Un adjunto en curso o terminado. La barra de progreso vive **acá adentro**.
 */

/** Tipo que la interfaz declara al backend (Modelo de Datos, 4.8). */
export type TipoDeArchivo = 'foto' | 'pdf' | 'estudio';

/**
 * El backend valida el MIME real contra el tipo declarado: el tipo **se
 * declara, no se adivina** por la extensión. `accept` es la lista que se le
 * pasa al selector de archivos; `humano` es cómo se le nombra al usuario.
 *
 * `accept` se aparta del `FILE_TYPES` del design system, que enumera
 * `image/jpeg,image/png,image/heic`: el backend admite **cualquier** imagen
 * para foto, y una lista cerrada deja afuera del selector archivos que el
 * servidor sí acepta (un WEBP, un AVIF). El texto que lee el usuario sigue
 * nombrando los tres formatos frecuentes, que es lo que le sirve saber.
 */
export const TIPOS_DE_ARCHIVO: Record<
  TipoDeArchivo,
  { icono: NombreDeIcono; etiqueta: string; accept: string; humano: string }
> = {
  foto: {
    icono: 'image',
    etiqueta: 'Foto',
    accept: 'image/*',
    humano: 'JPG, PNG o HEIC',
  },
  pdf: { icono: 'file-text', etiqueta: 'PDF', accept: 'application/pdf', humano: 'PDF' },
  estudio: {
    icono: 'microscope',
    etiqueta: 'Estudio',
    accept: 'application/pdf,image/*',
    humano: 'PDF o imagen',
  },
};

type Estado = 'subiendo' | 'listo' | 'fallo';

interface UploadItemProps {
  name: string;
  /** Peso ya formateado por quien lo usa: "1,2 MB". */
  size?: string;
  type?: TipoDeArchivo;
  status?: Estado;
  /** 0-100, solo con `status="subiendo"`. */
  progress?: number;
  /** Subida sin porcentaje conocido. */
  indeterminate?: boolean;
  /** Motivo del fallo, con el dato concreto: "Supera el límite de 10 MB" (413). */
  errorMessage?: string;
  /** `other` = lo subió el otro rol: se ve completo, sin acción y con la autoría a la vista. */
  owner?: 'mine' | 'other';
  ownerName?: string;
  /** Retirar, o cancelar si está subiendo. Solo se pasa cuando `owner === 'mine'` (regla 2.4). */
  onRemove?: () => void;
  onRetry?: () => void;
  removeLabel?: string;
}

export function UploadItem({
  name,
  size,
  type = 'foto',
  status = 'listo',
  progress = 0,
  indeterminate = false,
  errorMessage,
  owner = 'mine',
  ownerName,
  onRemove,
  onRetry,
  removeLabel,
}: UploadItemProps) {
  const { t, px, texto } = useTheme();

  const tipo = TIPOS_DE_ARCHIVO[type];
  const fallo = status === 'fallo';
  const subiendo = status === 'subiendo';
  const propio = owner === 'mine';

  const colorMeta = fallo ? t['--text-danger'] : t['--text-muted'];
  const separador = (
    <Text accessibilityElementsHidden style={[texto('caption'), { color: colorMeta }]}>
      ·
    </Text>
  );

  return (
    <View
      style={[
        estilos.raiz,
        {
          backgroundColor: t['--surface-card'],
          borderColor: fallo ? t['--border-danger'] : t['--border-default'],
          borderRadius: px('--radius-md'),
        },
      ]}
    >
      <View style={estilos.fila}>
        <View
          style={[
            estilos.icono,
            {
              borderRadius: px('--radius-sm'),
              backgroundColor: fallo ? t['--danger-50'] : t['--neutral-50'],
            },
          ]}
        >
          <Icon
            name={fallo ? 'alert-circle' : tipo.icono}
            size={18}
            color={fallo ? t['--danger-500'] : t['--text-muted']}
          />
        </View>

        <View style={estilos.cuerpo}>
          <Text numberOfLines={1} style={[texto('body-strong'), { color: t['--text-strong'] }]}>
            {name}
          </Text>

          <View style={estilos.meta}>
            <Text style={[texto('caption'), { color: colorMeta }]}>{tipo.etiqueta}</Text>
            {size ? (
              <>
                {separador}
                <Text style={[texto('caption'), estilos.numero, { color: colorMeta }]}>{size}</Text>
              </>
            ) : null}
            {status === 'listo' ? (
              <>
                {separador}
                <View style={estilos.listo}>
                  <Icon name="check" size={12} color={t['--text-success']} />
                  <Text style={[texto('caption'), { color: t['--text-success'] }]}>Listo</Text>
                </View>
              </>
            ) : null}
            {subiendo ? (
              <>
                {separador}
                <Text style={[texto('caption'), { color: colorMeta }]}>Subiendo</Text>
              </>
            ) : null}
            {fallo && errorMessage ? (
              <>
                {separador}
                <Text style={[texto('caption'), { color: colorMeta }]}>{errorMessage}</Text>
              </>
            ) : null}
          </View>

          {/*
            Adjunto de otro rol: se distingue por la autoría, NO por el color ni
            por opacidad — bajarle contraste lo haría leer como deshabilitado
            por error.
          */}
          {!propio && ownerName ? (
            <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
              Subido por {ownerName}
            </Text>
          ) : null}
        </View>

        {/* Cada rol retira solo lo que subió. Un adjunto no se edita: se retira y se sube otro. */}
        {propio && onRemove && !fallo ? (
          <IconButton
            icon={subiendo ? 'x' : 'trash-2'}
            size="sm"
            variant="ghost"
            onPress={onRemove}
            label={removeLabel ?? (subiendo ? 'Cancelar la subida' : 'Retirar el adjunto')}
          />
        ) : null}
      </View>

      {subiendo ? <ProgressBar value={progress} indeterminate={indeterminate} size="sm" /> : null}

      {fallo ? (
        <View style={estilos.acciones}>
          {onRetry ? (
            <Button size="sm" variant="secondary" iconLeft="rotate-ccw" onPress={onRetry}>
              Reintentar
            </Button>
          ) : null}
          {propio && onRemove ? (
            <Button size="sm" variant="ghost" onPress={onRemove}>
              Descartar
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1 },
  fila: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icono: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  cuerpo: { flex: 1, minWidth: 0, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  listo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  numero: { fontVariant: ['tabular-nums'] },
  acciones: { flexDirection: 'row', gap: 8 },
});
