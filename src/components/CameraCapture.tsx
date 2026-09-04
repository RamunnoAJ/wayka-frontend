import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useEntrada } from '../hooks';
import { ANCHO_BORDE_FOCO, colorDeFoco, duracion, resorte, useTheme } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

/** Cuánto se hunde el obturador. Es su propio valor: no es un press de control. */
const HUNDIDO_DEL_OBTURADOR = 0.9;

/** Opacidad del velo. Un blanco pleno tapa de más y se lee como un corte. */
const OPACIDAD_DEL_FLASH = 0.85;

/**
 * Port a React Native de `design-system/components/core/CameraCapture.jsx`.
 *
 * Cámara **dentro** de la app, no el picker del sistema: la foto clínica
 * necesita guía de encuadre y un paso de revisión antes de subir
 * (Alcance de Plataformas, 5.6). Es el paso previo a `UploadItem`.
 *
 * Este componente es solo la interfaz — no habla con la cámara ni pide permisos.
 * El fotograma vivo entra por `visor` y la toma congelada por `previewSrc`; quién
 * los produce es problema de quien lo use (`CamaraDeAdjunto`).
 *
 * **Es un panel, no una pantalla.** Llena el contenedor que le den y lo redondea;
 * quién lo posiciona —hoy `CamaraDeAdjunto`, al pie de la pantalla— es de afuera.
 *
 * Diferencias con el original del design system, y por qué:
 *
 * 1. **El visor es un slot, no una imagen.** En web el design system mete el
 *    fotograma por `previewSrc` como `<img>`; en nativo el visor vivo es una
 *    vista nativa (`CameraView`) que no se puede expresar como URI. Por eso
 *    `visor` recibe el elemento y `previewSrc` queda para la toma ya sacada.
 * 2. **Sin `backdrop-filter`.** No existe en React Native y resolverlo pedía
 *    `expo-blur`, que sobre un visor vivo cuesta cuadros en Android. Los
 *    controles se sostienen con el degradado de abajo, que sí es fiel.
 * 3. **Una sola fila de controles, sin barra superior ni título.** El original
 *    reparte los controles arriba (cerrar, título, flash) y abajo (galería,
 *    obturador, girar). Acá el panel no ocupa la pantalla entera: lo que está
 *    arriba es la ficha del paciente, y una barra de la cámara ahí se leería
 *    como parte de la ficha. Todo baja a `‹ · obturador · ···`, con el resto
 *    —galería, modo, flash, girar— desplegándose desde `···` en una columna al
 *    alcance del pulgar. El modo `documento` no desaparece: la guía de encuadre
 *    es contrato (Alcance de Plataformas, 5.6), solo cambia de lugar.
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

/** Lado del chip flotante. Lo usa la columna para saber a qué altura empezar. */
const LADO_DEL_CHIP = 44;

/** Separación entre los chips de la columna, y entre la columna y el `···`. */
const HUECO_DE_LA_COLUMNA = 8;

/** Lado del obturador. Es lo alto que es la fila: los chips van centrados en él. */
const LADO_DEL_OBTURADOR = 76;

/**
 * Cuánto sube la columna desde el borde de abajo del panel para apoyarse justo
 * arriba del `···`. El chip no está pegado al margen: va centrado en una fila
 * tan alta como el obturador, y ese centrado es lo que suma el término del medio.
 */
const ALTURA_DE_LA_COLUMNA =
  (LADO_DEL_OBTURADOR - LADO_DEL_CHIP) / 2 + LADO_DEL_CHIP + HUECO_DE_LA_COLUMNA;

/**
 * `StyleSheet.absoluteFillObject` no está en los tipos de esta versión de React
 * Native, y `absoluteFill` es un id registrado que no se puede desarmar dentro
 * de `StyleSheet.create`.
 */
const LLENA = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

interface CameraCaptureProps {
  status?: EstadoDeCamara;
  mode?: ModoDeCamara;
  /** Modos ofrecidos, en orden. Con uno solo, el cambio de modo no se ofrece. */
  modes?: ModoDeCamara[];
  flash?: FlashDeCamara;
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
  hint,
  visor,
  previewSrc,
  galleryThumb,
  galleryCount,
  confirmLabel = 'Usar',
  retakeLabel = 'Repetir',
  deniedTitle = 'Wayka no tiene acceso a la cámara',
  deniedBody = 'Sin cámara podés adjuntar fotos que ya tengas en el teléfono, pero no tomar una nueva desde acá.',
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
  const reducido = useReducedMotion();
  const entradaDeLaColumna = useEntrada();

  const [opciones, setOpciones] = useState(false);

  // Los tres momentos de la captura (Movimiento, sección 9): el obturador
  // confirma que se sacó la foto, el velo tapa el salto del sensor, y el paso a
  // revisión cruza sin desplazamiento — el encuadre no puede saltar.
  const flashDeCaptura = useSharedValue(0);
  const hundido = useSharedValue(1);

  const veloDeFlash = useAnimatedStyle(() => ({ opacity: flashDeCaptura.get() }));
  const estiloDelObturador = useAnimatedStyle(() => ({
    transform: [{ scale: hundido.get() }],
  }));

  const modoActual = MODOS_DE_CAMARA[mode];
  const revisando = status === 'revisando' || status === 'procesando';
  const ocupado = status === 'procesando';
  const sinPermiso = status === 'sin-permiso';
  const flashActual = FLASH[flash];

  // La columna no sobrevive a la captura ni a la falta de permiso: quedaría
  // flotando sobre una toma congelada, ofreciendo ajustar un encuadre que ya no
  // existe. Se cierra al disparar, y el estado se ignora mientras no haya visor.
  const opcionesAbiertas = opciones && !revisando && !sinPermiso;

  const capturar = () => {
    setOpciones(false);
    if (!reducido) {
      hundido.set(
        withSequence(withSpring(HUNDIDO_DEL_OBTURADOR, resorte.snap), withSpring(1, resorte.snap)),
      );
      flashDeCaptura.set(
        withSequence(
          withTiming(OPACIDAD_DEL_FLASH, duracion.instant),
          withTiming(0, duracion.instant),
        ),
      );
    }
    onCapture?.();
  };

  const siguienteFlash = () => {
    const proximo = ORDEN_DE_FLASH[(ORDEN_DE_FLASH.indexOf(flash) + 1) % ORDEN_DE_FLASH.length];
    if (proximo) onFlashChange?.(proximo);
  };

  // El modo se cambia con un solo chip y no con un selector de pestañas: en la
  // columna hay lugar para un control, no para dos opciones lado a lado. Con más
  // de dos modos rotaría, que es lo mismo que hace el flash.
  const indiceDeModo = modes.indexOf(mode);
  const siguienteModo = modes[(indiceDeModo + 1) % modes.length];

  return (
    <View
      style={[
        estilos.raiz,
        { borderRadius: px('--radius-xl'), backgroundColor: t['--surface-immersive'] },
      ]}
    >
      {/* El visor vivo lo aporta quien usa el componente; la toma congelada entra por previewSrc. */}
      <View style={[estilos.visor, { backgroundColor: t['--wayka-oscuro'] }]}>
        {visor ?? (
          <View style={estilos.centrado}>
            <Text style={[texto('overline'), { color: t['--text-on-immersive-muted'] }]}>
              VISOR
            </Text>
          </View>
        )}

        {/* La toma congelada se dibuja encima y cruza con timing, sin
            desplazamiento. El visor vivo queda montado debajo: desmontarlo para
            volver a montarlo al repetir la foto reiniciaría la cámara. */}
        {previewSrc ? (
          <Animated.View
            entering={FadeIn.duration(reducido ? 0 : duracion.normal.duration)}
            exiting={FadeOut.duration(reducido ? 0 : duracion.normal.duration)}
            style={[estilos.llena, estilos.encima]}
          >
            {/* La atenuación de `procesando` va en una capa aparte: si
                compartiera vista con el cruce, la opacidad de la entrada la
                pisaría. */}
            <View style={[estilos.llena, ocupado && estilos.atenuada]}>
              <Image source={{ uri: previewSrc }} resizeMode="cover" style={estilos.llena} />
            </View>
          </Animated.View>
        ) : null}

        {/* Velo del obturador. `pointerEvents="none"`: tapa la imagen, no los
            controles que están debajo del dedo. */}
        <Animated.View
          pointerEvents="none"
          style={[
            estilos.llena,
            estilos.encima,
            { backgroundColor: t['--wayka-blanco'] },
            veloDeFlash,
          ]}
        />
      </View>

      {!sinPermiso && !revisando && mode === 'documento' ? (
        <GuiaDeEncuadre color={t['--immersive-accent']} radio={px('--radius-sm')} />
      ) : null}

      {/* Un solo degradado, abajo: sin barra superior no hay nada arriba que sostener. */}
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', t['--surface-immersive']]}
        style={estilos.degradado}
      />

      <View style={[estilos.capa, { padding: px('--gutter-mobile') }]}>
        <View style={estilos.flexible} />

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
        ) : null}

        <View style={estilos.flexible} />

        <View style={estilos.controles}>
          {!sinPermiso && (hint || (!revisando && modoActual.ayuda)) ? (
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
              {/* Vuelve a los adjuntos, de donde se llegó: es la salida y no una
                  cruz de descarte — no hay nada sacado que se pierda. */}
              <Chip icono="chevron-left" etiqueta="Cerrar la cámara" onPress={onClose} />

              {sinPermiso ? (
                <View style={estilos.huecoDeChip} />
              ) : (
                /* El obturador queda blanco: es la convención de cámara y no compite con el acento. */
                <PressableAnimado
                  accessibilityRole="button"
                  accessibilityLabel={`Tomar ${modoActual.etiqueta.toLowerCase()}`}
                  onPress={capturar}
                  style={[
                    estilos.obturador,
                    { borderRadius: px('--radius-pill'), borderColor: t['--border-on-immersive'] },
                    estiloDelObturador,
                  ]}
                >
                  <View
                    style={[
                      estilos.obturadorInterno,
                      { borderRadius: px('--radius-pill'), backgroundColor: t['--wayka-blanco'] },
                    ]}
                  />
                </PressableAnimado>
              )}

              {sinPermiso ? (
                <View style={estilos.huecoDeChip} />
              ) : (
                <Chip
                  icono={opcionesAbiertas ? 'x' : 'ellipsis'}
                  etiqueta={opcionesAbiertas ? 'Cerrar las opciones' : 'Opciones de la cámara'}
                  expandido={opcionesAbiertas}
                  onPress={() => setOpciones((valor) => !valor)}
                />
              )}
            </View>
          )}
        </View>

        {/* La columna cuelga de la capa y no de la celda del `···`: dentro de una
            vista de 44 px, Android recorta lo que se sale.

            Los desplazamientos suman el margen a mano porque Yoga posiciona a un
            hijo absoluto contra el **borde** del padre y no contra su caja de
            relleno: sin esto la columna se va contra el borde del panel, corrida
            del `···` que la abre. */}
        {opcionesAbiertas ? (
          <Animated.View
            entering={entradaDeLaColumna}
            exiting={FadeOut.duration(reducido ? 0 : duracion.fast.duration)}
            style={[
              estilos.columna,
              {
                right: px('--gutter-mobile'),
                bottom: px('--gutter-mobile') + ALTURA_DE_LA_COLUMNA,
              },
            ]}
          >
            {onGallery ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Elegir de la galería"
                onPress={onGallery}
                style={[
                  estilos.galeria,
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
            ) : null}

            {siguienteModo && modes.length > 1 ? (
              <Chip
                icono={MODOS_DE_CAMARA[siguienteModo].icono}
                etiqueta={`Cambiar a modo ${MODOS_DE_CAMARA[siguienteModo].etiqueta.toLowerCase()}`}
                activo={mode === 'documento'}
                onPress={() => onModeChange?.(siguienteModo)}
              />
            ) : null}

            <Chip
              icono={flashActual.icono}
              etiqueta={flashActual.etiqueta}
              activo={flash !== 'off'}
              onPress={siguienteFlash}
            />

            {onFlip ? (
              <Chip icono="refresh-cw" etiqueta="Cambiar de cámara" onPress={onFlip} />
            ) : null}
          </Animated.View>
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
  expandido,
}: {
  icono: NombreDeIcono;
  etiqueta: string;
  onPress?: () => void;
  activo?: boolean;
  expandido?: boolean;
}) {
  const { t, px } = useTheme();
  const [enfocado, setEnfocado] = useState(false);
  const [sobrevolado, setSobrevolado] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activo, expanded: expandido }}
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
  raiz: { flex: 1, width: '100%', overflow: 'hidden' },
  visor: { ...LLENA },
  llena: { width: '100%', height: '100%' },
  encima: { position: 'absolute', top: 0, left: 0 },
  atenuada: { opacity: 0.7 },
  centrado: { ...LLENA, alignItems: 'center', justifyContent: 'center' },
  degradado: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: ALTO_DEL_DEGRADADO,
    opacity: 0.9,
  },
  capa: { ...LLENA, justifyContent: 'flex-end', gap: 12 },
  flexible: { flex: 1 },
  huecoDeChip: { width: LADO_DEL_CHIP, height: LADO_DEL_CHIP },
  chip: {
    width: LADO_DEL_CHIP,
    height: LADO_DEL_CHIP,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  columna: { position: 'absolute', alignItems: 'center', gap: HUECO_DE_LA_COLUMNA },
  galeria: { width: LADO_DEL_CHIP, height: LADO_DEL_CHIP, borderWidth: 1 },
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
    width: LADO_DEL_OBTURADOR,
    height: LADO_DEL_OBTURADOR,
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
