import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ANCHO_BORDE_FOCO, colorDeFoco, useTheme } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

/**
 * Port a React Native de `design-system/components/core/CameraCapture.jsx`.
 *
 * Cámara **dentro** de la app, no el picker del sistema: la foto clínica
 * necesita guía de encuadre y un paso de revisión antes de subir. Es el paso
 * previo a `UploadItem`.
 *
 * Este componente es solo la interfaz — no habla con la cámara ni pide permisos.
 * El fotograma vivo entra por `visor` y la toma congelada por `previewSrc`; quién
 * los produce es problema de quien lo use (`CamaraDeAdjunto`).
 *
 * Dos diferencias con el original, las dos de plataforma:
 *
 * 1. **El visor es un slot, no una imagen.** En web el design system mete el
 *    fotograma por `previewSrc` como `<img>`; en nativo el visor vivo es una
 *    vista nativa (`CameraView`) que no se puede expresar como URI. Por eso
 *    `visor` recibe el elemento y `previewSrc` queda para la toma ya sacada.
 * 2. **Sin `backdrop-filter`.** No existe en React Native y resolverlo pedía
 *    `expo-blur`, que sobre un visor vivo cuesta cuadros en Android. Los
 *    controles se sostienen con los degradados de arriba y abajo, que sí son
 *    fieles: para eso entró `expo-linear-gradient`.
 */
export type ModoDeCamara = 'foto' | 'documento';
export type EstadoDeCamara = 'listo' | 'revisando' | 'procesando' | 'sin-permiso';
export type FlashDeCamara = 'off' | 'auto' | 'on';

export const MODOS_DE_CAMARA: Record<
  ModoDeCamara,
  { etiqueta: string; icono: NombreDeIcono; ayuda: string }
> = {
  foto: { etiqueta: 'Foto', icono: 'camera', ayuda: 'Acercate y evitá el contraluz.' },
  documento: {
    etiqueta: 'Documento',
    icono: 'scan-line',
    ayuda: 'Apoyá la ficha en una superficie plana.',
  },
};

const FLASH: Record<FlashDeCamara, { icono: NombreDeIcono; etiqueta: string }> = {
  off: { icono: 'zap-off', etiqueta: 'Flash apagado' },
  auto: { icono: 'zap', etiqueta: 'Flash automático' },
  on: { icono: 'zap', etiqueta: 'Flash encendido' },
};

const ORDEN_DE_FLASH: FlashDeCamara[] = ['off', 'auto', 'on'];

const ALTO_DEL_DEGRADADO = 148;

/**
 * `StyleSheet.absoluteFillObject` no está en los tipos de esta versión de React
 * Native, y `absoluteFill` es un id registrado que no se puede desarmar dentro
 * de `StyleSheet.create`.
 */
const LLENA = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

interface CameraCaptureProps {
  status?: EstadoDeCamara;
  mode?: ModoDeCamara;
  /** Modos ofrecidos, en orden. Con uno solo, el selector no se dibuja. */
  modes?: ModoDeCamara[];
  flash?: FlashDeCamara;
  /** Para qué se está sacando la foto: "Herida · Mora". */
  title?: string;
  /** Reemplaza la ayuda de encuadre del modo. */
  hint?: string;
  /** Fotograma vivo: la vista nativa de la cámara. */
  visor?: ReactNode;
  /** Toma ya sacada, en `revisando` y `procesando`. */
  previewSrc?: string;
  galleryThumb?: string;
  galleryCount?: number;
  confirmLabel?: string;
  retakeLabel?: string;
  deniedTitle?: string;
  deniedBody?: string;
  /** `false` = a sangre, sin radio (pantalla completa). */
  framed?: boolean;
  onCapture?: () => void;
  onRetake?: () => void;
  onConfirm?: () => void;
  onClose?: () => void;
  onFlip?: () => void;
  onGallery?: () => void;
  onModeChange?: (modo: ModoDeCamara) => void;
  onFlashChange?: (flash: FlashDeCamara) => void;
  onOpenSettings?: () => void;
}

export function CameraCapture({
  status = 'listo',
  mode = 'foto',
  modes = ['foto', 'documento'],
  flash = 'off',
  title,
  hint,
  visor,
  previewSrc,
  galleryThumb,
  galleryCount,
  confirmLabel = 'Usar',
  retakeLabel = 'Repetir',
  deniedTitle = 'Wayka no tiene acceso a la cámara',
  deniedBody = 'Sin cámara podés adjuntar fotos que ya tengas en el teléfono, pero no tomar una nueva desde acá.',
  framed = true,
  onCapture,
  onRetake,
  onConfirm,
  onClose,
  onFlip,
  onGallery,
  onModeChange,
  onFlashChange,
  onOpenSettings,
}: CameraCaptureProps) {
  const { t, px, texto } = useTheme();

  const modoActual = MODOS_DE_CAMARA[mode];
  const revisando = status === 'revisando' || status === 'procesando';
  const ocupado = status === 'procesando';
  const sinPermiso = status === 'sin-permiso';
  const flashActual = FLASH[flash];

  const siguienteFlash = () => {
    const proximo = ORDEN_DE_FLASH[(ORDEN_DE_FLASH.indexOf(flash) + 1) % ORDEN_DE_FLASH.length];
    if (proximo) onFlashChange?.(proximo);
  };

  return (
    <View
      style={[
        estilos.raiz,
        {
          borderRadius: framed ? px('--radius-card') : 0,
          backgroundColor: t['--surface-immersive'],
        },
      ]}
    >
      {/* El visor vivo lo aporta quien usa el componente; la toma congelada entra por previewSrc. */}
      <View style={[estilos.visor, { backgroundColor: t['--wayka-oscuro'] }]}>
        {previewSrc ? (
          <Image
            source={{ uri: previewSrc }}
            resizeMode="cover"
            style={[estilos.llena, ocupado && estilos.atenuada]}
          />
        ) : (
          (visor ?? (
            <View style={estilos.centrado}>
              <Text style={[texto('overline'), { color: t['--text-on-immersive-muted'] }]}>
                VISOR
              </Text>
            </View>
          ))
        )}
      </View>

      {!sinPermiso && !revisando && mode === 'documento' ? (
        <GuiaDeEncuadre color={t['--immersive-accent']} radio={px('--radius-sm')} />
      ) : null}

      <LinearGradient
        pointerEvents="none"
        colors={[t['--surface-immersive'], 'transparent']}
        style={[estilos.degradado, estilos.degradadoArriba]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', t['--surface-immersive']]}
        style={[estilos.degradado, estilos.degradadoAbajo]}
      />

      <View style={[estilos.capa, { padding: px('--gutter-mobile') }]}>
        <View style={estilos.barraSuperior}>
          <Chip icono="x" etiqueta="Cerrar la cámara" onPress={onClose} />
          {title ? (
            <Text
              numberOfLines={1}
              style={[texto('body-strong'), estilos.titulo, { color: t['--text-on-immersive'] }]}
            >
              {title}
            </Text>
          ) : (
            <View style={estilos.flexible} />
          )}
          {!sinPermiso && !revisando ? (
            <Chip
              icono={flashActual.icono}
              etiqueta={flashActual.etiqueta}
              activo={flash !== 'off'}
              onPress={siguienteFlash}
            />
          ) : (
            <View style={estilos.huecoDeChip} />
          )}
        </View>

        {sinPermiso ? (
          <View
            style={[
              estilos.sinPermiso,
              {
                padding: px('--space-7'),
                borderRadius: px('--radius-card'),
                backgroundColor: t['--surface-immersive-item'],
                borderColor: t['--border-on-immersive'],
              },
            ]}
          >
            <Icon name="camera-off" size={24} color={t['--text-on-immersive-muted']} />
            <Text
              style={[texto('body-lg'), estilos.centrarTexto, { color: t['--text-on-immersive'] }]}
            >
              {deniedTitle}
            </Text>
            <Text
              style={[
                texto('body-sm'),
                estilos.centrarTexto,
                { color: t['--text-on-immersive-muted'] },
              ]}
            >
              {deniedBody}
            </Text>
            {/* Como en PermissionCard: los ajustes son texto, no un botón de relleno. */}
            {onOpenSettings ? (
              <Pressable accessibilityRole="button" onPress={onOpenSettings}>
                <Text
                  style={[texto('body-strong'), estilos.enlace, { color: t['--immersive-accent'] }]}
                >
                  Abrir ajustes del teléfono
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={estilos.flexible} />
        )}

        {!sinPermiso ? (
          <View style={estilos.controles}>
            {hint || (!revisando && modoActual.ayuda) ? (
              <Text
                style={[
                  texto('body-sm'),
                  estilos.centrarTexto,
                  { color: t['--text-on-immersive-muted'] },
                ]}
              >
                {ocupado
                  ? 'Guardando la toma…'
                  : revisando
                    ? (hint ?? '')
                    : (hint ?? modoActual.ayuda)}
              </Text>
            ) : null}

            {/* Revisando no ofrece modos: la toma ya está sacada, no hay nada que configurar. */}
            {!revisando && modes.length > 1 ? (
              <View
                accessibilityRole="tablist"
                style={[
                  estilos.selectorDeModo,
                  {
                    borderRadius: px('--radius-pill'),
                    backgroundColor: t['--surface-immersive-item-hover'],
                    borderColor: t['--border-on-immersive'],
                  },
                ]}
              >
                {modes.map((clave) => {
                  const activo = clave === mode;
                  return (
                    <Pressable
                      key={clave}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: activo }}
                      onPress={() => onModeChange?.(clave)}
                      style={[
                        estilos.modo,
                        {
                          borderRadius: px('--radius-pill'),
                          backgroundColor: activo ? t['--immersive-accent'] : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          texto('body-strong'),
                          {
                            fontSize: Number.parseFloat(t['--fs-body-sm']),
                            color: activo ? t['--wayka-oscuro'] : t['--text-on-immersive-muted'],
                          },
                        ]}
                      >
                        {MODOS_DE_CAMARA[clave].etiqueta}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {revisando ? (
              <View style={estilos.dosAcciones}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: ocupado }}
                  disabled={ocupado}
                  onPress={onRetake}
                  style={[
                    estilos.accion,
                    {
                      height: px('--control-h-touch'),
                      borderRadius: px('--radius-control'),
                      backgroundColor: t['--surface-immersive-item'],
                      borderColor: t['--border-on-immersive'],
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={[texto('body-lg'), { color: t['--text-on-immersive'] }]}>
                    {retakeLabel}
                  </Text>
                </Pressable>

                {/* Procesando deja los dos botones donde están: no se saca el botón de debajo del dedo. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: ocupado, busy: ocupado }}
                  disabled={ocupado}
                  onPress={onConfirm}
                  style={[
                    estilos.accion,
                    {
                      height: px('--control-h-touch'),
                      borderRadius: px('--radius-control'),
                      backgroundColor: t['--immersive-accent'],
                    },
                  ]}
                >
                  {ocupado ? <ActivityIndicator size="small" color={t['--wayka-oscuro']} /> : null}
                  <Text style={[texto('body-lg'), { color: t['--wayka-oscuro'] }]}>
                    {ocupado ? 'Guardando' : confirmLabel}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={estilos.barraDeCaptura}>
                {onGallery ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Elegir del carrete"
                    onPress={onGallery}
                    style={[
                      estilos.carrete,
                      {
                        borderRadius: px('--radius-md'),
                        backgroundColor: t['--surface-immersive-item'],
                        borderColor: t['--border-on-immersive'],
                      },
                    ]}
                  >
                    <View style={[estilos.recorte, { borderRadius: px('--radius-md') }]}>
                      {galleryThumb ? (
                        <Image
                          source={{ uri: galleryThumb }}
                          resizeMode="cover"
                          style={estilos.llena}
                        />
                      ) : (
                        <Icon name="images" size={18} color={t['--text-on-immersive']} />
                      )}
                    </View>
                    {galleryCount ? (
                      <View
                        style={[
                          estilos.contador,
                          {
                            borderRadius: px('--radius-pill'),
                            backgroundColor: t['--immersive-accent'],
                          },
                        ]}
                      >
                        <Text style={[texto('overline'), { color: t['--wayka-oscuro'] }]}>
                          {galleryCount}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                ) : (
                  <View style={estilos.huecoDeChip} />
                )}

                {/* El obturador queda blanco: es la convención de cámara y no compite con el acento. */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Tomar ${modoActual.etiqueta.toLowerCase()}`}
                  onPress={onCapture}
                  style={[
                    estilos.obturador,
                    { borderRadius: px('--radius-pill'), borderColor: t['--border-on-immersive'] },
                  ]}
                >
                  <View
                    style={[
                      estilos.obturadorInterno,
                      { borderRadius: px('--radius-pill'), backgroundColor: t['--wayka-blanco'] },
                    ]}
                  />
                </Pressable>

                {onFlip ? (
                  <Chip icono="refresh-cw" etiqueta="Cambiar de cámara" onPress={onFlip} />
                ) : (
                  <View style={estilos.huecoDeChip} />
                )}
              </View>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Botón redondo flotante sobre el visor. */
function Chip({
  icono,
  etiqueta,
  onPress,
  activo,
}: {
  icono: NombreDeIcono;
  etiqueta: string;
  onPress?: () => void;
  activo?: boolean;
}) {
  const { t, px } = useTheme();
  const [enfocado, setEnfocado] = useState(false);
  const [sobrevolado, setSobrevolado] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      onHoverIn={() => setSobrevolado(true)}
      onHoverOut={() => setSobrevolado(false)}
      style={[
        estilos.chip,
        {
          borderRadius: px('--radius-pill'),
          backgroundColor: activo
            ? t['--immersive-accent']
            : sobrevolado
              ? t['--surface-immersive-item']
              : t['--surface-immersive-item-hover'],
          // El visor es superficie oscura: el anillo de foco va blanco.
          borderWidth: enfocado ? ANCHO_BORDE_FOCO : 1,
          borderColor: enfocado
            ? colorDeFoco(t['--border-focus'], true)
            : activo
              ? t['--immersive-accent']
              : t['--border-on-immersive'],
        },
      ]}
    >
      <Icon
        name={icono}
        size={20}
        color={activo ? t['--wayka-oscuro'] : t['--text-on-immersive']}
      />
    </Pressable>
  );
}

/**
 * Cuatro esquinas y nada más: un rectángulo cerrado se lee como un recorte que
 * ya se aplicó, y acá el recorte todavía no existe.
 */
function GuiaDeEncuadre({ color, radio }: { color: string; radio: number }) {
  const esquina = { borderColor: color };
  return (
    <View pointerEvents="none" style={estilos.capaDeGuia}>
      <View style={estilos.marco}>
        <View
          style={[
            estilos.esquina,
            esquina,
            estilos.arribaIzq,
            { borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: radio },
          ]}
        />
        <View
          style={[
            estilos.esquina,
            esquina,
            estilos.arribaDer,
            { borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: radio },
          ]}
        />
        <View
          style={[
            estilos.esquina,
            esquina,
            estilos.abajoIzq,
            { borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: radio },
          ]}
        />
        <View
          style={[
            estilos.esquina,
            esquina,
            estilos.abajoDer,
            { borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: radio },
          ]}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, width: '100%', minHeight: 520, overflow: 'hidden' },
  visor: { ...LLENA },
  llena: { width: '100%', height: '100%' },
  atenuada: { opacity: 0.7 },
  centrado: { ...LLENA, alignItems: 'center', justifyContent: 'center' },
  degradado: { position: 'absolute', left: 0, right: 0, height: ALTO_DEL_DEGRADADO, opacity: 0.9 },
  degradadoArriba: { top: 0 },
  degradadoAbajo: { bottom: 0 },
  capa: { ...LLENA, justifyContent: 'space-between', gap: 12 },
  barraSuperior: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { flex: 1, textAlign: 'center' },
  flexible: { flex: 1 },
  huecoDeChip: { width: 44, height: 44 },
  chip: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sinPermiso: {
    alignSelf: 'center',
    alignItems: 'center',
    maxWidth: 320,
    gap: 12,
    borderWidth: 1,
  },
  centrarTexto: { textAlign: 'center' },
  enlace: { textDecorationLine: 'underline' },
  controles: { gap: 16, alignItems: 'center' },
  selectorDeModo: { flexDirection: 'row', gap: 2, padding: 3, borderWidth: 1 },
  modo: { height: 32, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  dosAcciones: { flexDirection: 'row', gap: 12, width: '100%' },
  accion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  barraDeCaptura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  carrete: { width: 44, height: 44, borderWidth: 1 },
  recorte: {
    ...LLENA,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obturador: {
    width: 76,
    height: 76,
    padding: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obturadorInterno: { width: '100%', height: '100%' },
  capaDeGuia: { ...LLENA, alignItems: 'center', justifyContent: 'center' },
  marco: { width: '82%', aspectRatio: 1 / 1.35, maxHeight: '68%' },
  esquina: { position: 'absolute', width: 26, height: 26 },
  arribaIzq: { top: 0, left: 0 },
  arribaDer: { top: 0, right: 0 },
  abajoIzq: { bottom: 0, left: 0 },
  abajoDer: { bottom: 0, right: 0 },
});
