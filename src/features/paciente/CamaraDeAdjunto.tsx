import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  useReducedMotion,
  withSpring,
  withTiming,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';

import {
  CameraCapture,
  type EstadoDeCamara,
  type FlashDeCamara,
  type ModoDeCamara,
} from '../../components';
import type { ArchivoElegido } from '../../lib/archivos';
import { duracion, resorte, SIN_DURACION, useTheme } from '../../theme';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

/** Cuánto de la pantalla ocupa el panel. */
const PROPORCION_DEL_PANEL = 0.58;

/** Piso: por debajo el visor deja de servir para encuadrar una herida. */
const ALTO_MINIMO = 380;

/** Cuánto de la ficha queda a la vista arriba del panel, siempre. */
const ASOMO_DE_LA_FICHA = 140;

/**
 * La cámara con la que el tutor saca la foto de una herida y el veterinario la
 * de un estudio en papel (Alcance de Plataformas, 3.4 y 5.6).
 *
 * Es lo que conecta `CameraCapture` —que es solo la interfaz— con `expo-camera`
 * y con el archivo que después sube `SubidaDeAdjunto`.
 *
 * **Es un panel al pie de la pantalla, no una pantalla completa.** Sacar una
 * foto es un paso dentro de la carga de un adjunto, no un destino: tapar la
 * ficha entera hacía perder de vista de qué mascota se estaba hablando, y volver
 * se leía como salir de una pantalla en vez de cerrar un panel. Arriba queda la
 * ficha, atenuada por el telón.
 *
 * Sigue montándose dentro de un `Modal`: es el único primitivo de React Native
 * que se dibuja por encima de la barra de pestañas y que atiende el botón atrás
 * de Android. `transparent`, para que la ficha se vea detrás.
 *
 * **Solo nativo.** En web no se monta: `expo-camera` ahí pide `getUserMedia`,
 * que necesita HTTPS y un permiso del navegador, y la web es la pantalla de la
 * clínica, donde el archivo llega del disco. Quien la abre ya decidió que está
 * en un teléfono.
 *
 * **Se monta solo mientras está abierta.** No hay una prop `visible`: el estado
 * de la toma se descarta al desmontar, sin un efecto que lo limpie a mano —
 * reabrirla con la foto anterior colgada sería mostrar una imagen vieja.
 */
interface CamaraDeAdjuntoProps {
  onCerrar: () => void;
  /** La toma confirmada, lista para subir. */
  onTomada: (archivo: ArchivoElegido) => void;
  /** Abre el selector de archivos, para el que ya tiene la foto en el teléfono. */
  onAbrirGaleria?: () => void;
}

export function CamaraDeAdjunto({ onCerrar, onTomada, onAbrirGaleria }: CamaraDeAdjuntoProps) {
  const { t, px } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: altoDePantalla } = useWindowDimensions();
  const camara = useRef<CameraView>(null);
  const [permiso, pedirPermiso] = useCameraPermissions();

  const [modo, setModo] = useState<ModoDeCamara>('foto');
  const [flash, setFlash] = useState<FlashDeCamara>('off');
  const [frontal, setFrontal] = useState(false);
  const [toma, setToma] = useState<CameraCapturedPicture | null>(null);
  const [sacando, setSacando] = useState(false);
  // El sensor tarda en abrirse y `takePictureAsync` antes de eso tira
  // `CameraOutputNotReadyException`. El obturador se dibuja apenas monta la
  // vista, así que el primer toque suele llegar antes que la cámara.
  const [lista, setLista] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const alto = Math.min(
    Math.max(altoDePantalla * PROPORCION_DEL_PANEL, ALTO_MINIMO),
    altoDePantalla - ASOMO_DE_LA_FICHA,
  );
  const entradaDelPanel = useEntradaDelPanel(alto);

  // El permiso se pide al abrir la cámara y no al montar la pantalla que la
  // contiene: el prompt del sistema aparece cuando el usuario ya dijo que quiere
  // sacar una foto, que es cuando el pedido se entiende.
  useEffect(() => {
    if (permiso && !permiso.granted && permiso.canAskAgain) void pedirPermiso();
  }, [permiso, pedirPermiso]);

  const estado: EstadoDeCamara = (() => {
    if (permiso && !permiso.granted && !permiso.canAskAgain) return 'sin-permiso';
    if (sacando) return 'procesando';
    if (toma) return 'revisando';
    return 'listo';
  })();

  function descartarLaToma() {
    setToma(null);
    setFallo(null);
  }

  /**
   * Con una toma en revisión, salir no cierra el panel: descarta la toma y
   * vuelve al visor. Cerrar de una perdería una foto que el usuario todavía no
   * decidió tirar, y es el mismo gesto —atrás, o tocar afuera— que en el visor
   * sí cierra.
   */
  function salir() {
    if (toma) descartarLaToma();
    else onCerrar();
  }

  async function capturar() {
    if (!camara.current || sacando || !lista) return;
    setSacando(true);
    setFallo(null);
    try {
      // exif en false: la foto de una herida no necesita llevar la ubicación de
      // la casa del tutor a un bucket. El backend guarda lo que le llega.
      const sacada = await camara.current.takePictureAsync({ quality: 0.85, exif: false });
      if (sacada) setToma(sacada);
    } catch {
      // La toma puede fallar por el sensor, no solo por llegar temprano: sin
      // catch la promesa queda rechazada y el error sale por consola en vez de
      // por la pantalla.
      setFallo('No se pudo sacar la foto. Probá de nuevo.');
    } finally {
      setSacando(false);
    }
  }

  function confirmar() {
    if (!toma) return;
    onTomada({
      uri: toma.uri,
      nombre: nombreDeLaToma(),
      // expo-camera devuelve JPEG en las dos plataformas, así que el tipo no se
      // adivina de la extensión. El backend lo verifica igual leyendo el
      // contenido: esto es lo que se declara, no lo que se prueba.
      contentType: 'image/jpeg',
      // El peso real lo pone el backend en la respuesta. Acá no se conoce sin
      // leer el archivo entero, que es justo lo que la subida evita hacer.
      tamanoBytes: 0,
    });
    setToma(null);
    onCerrar();
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={salir} statusBarTranslucent>
      <PressableAnimado
        entering={FadeIn.duration(duracion.normal.duration)}
        exiting={FadeOut.duration(duracion.fast.duration)}
        style={estilos.telon}
        accessibilityLabel="Cerrar la cámara"
        onPress={salir}
      >
        {/* El press del telón no debe atravesar el panel: sin este Pressable
            mudo, tocar el visor para encuadrar cerraría la cámara. */}
        <Pressable
          onPress={() => {}}
          style={[
            estilos.panel,
            {
              height: alto,
              marginHorizontal: px('--gutter-mobile'),
              marginBottom: insets.bottom + px('--space-3'),
              borderRadius: px('--radius-xl'),
              backgroundColor: t['--surface-immersive'],
            },
          ]}
        >
          <Animated.View entering={entradaDelPanel} style={estilos.llena}>
            <CameraCapture
              status={estado}
              mode={modo}
              flash={flash}
              previewSrc={toma?.uri}
              hint={fallo ?? (lista ? undefined : 'Preparando la cámara…')}
              /* El visor no se monta hasta que el permiso está dado. CameraX abre
                 el sensor apenas la vista existe, y si el prompt del sistema
                 todavía está arriba el intento falla con `SECURITY_EXCEPTION` y
                 **no reintenta** al concederse: el visor queda negro para
                 siempre, la primera vez que alguien usa la cámara. */
              visor={
                permiso?.granted ? (
                  <CameraView
                    ref={camara}
                    style={estilos.llena}
                    // Sin `ratio` el preview se escala para cubrir y se sale del
                    // panel: en Android es un SurfaceView, que se compone por
                    // fuera del árbol de vistas y no lo recorta ni el
                    // `overflow: hidden` ni el radio del contenedor. Con una
                    // relación fija entra completo, con banda antes que derrame.
                    ratio="4:3"
                    facing={frontal ? 'front' : 'back'}
                    flash={flash}
                    onCameraReady={() => setLista(true)}
                    onMountError={() => setFallo('No se pudo abrir la cámara.')}
                  />
                ) : undefined
              }
              onCapture={() => void capturar()}
              onRetake={descartarLaToma}
              onConfirm={confirmar}
              onClose={onCerrar}
              onFlip={() => setFrontal((valor) => !valor)}
              onGallery={onAbrirGaleria}
              onModeChange={setModo}
              onFlashChange={setFlash}
              onOpenSettings={() => void Linking.openSettings()}
            />
          </Animated.View>
        </Pressable>
      </PressableAnimado>
    </Modal>
  );
}

/**
 * El panel sube desde el borde de abajo hasta su sitio. No usa `useEntrada`: ese
 * recorre los 6 px de un bloque que ya está en la pantalla, y este viene de
 * fuera de ella. Con movimiento reducido queda el fade, sin recorrido.
 */
function useEntradaDelPanel(alto: number): EntryExitAnimationFunction {
  const reducido = useReducedMotion();
  return useCallback(() => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateY: reducido ? 0 : alto }] },
      animations: {
        opacity: withTiming(1, reducido ? SIN_DURACION : duracion.normal),
        transform: [{ translateY: withSpring(0, resorte.gentle) }],
      },
    };
  }, [alto, reducido]);
}

/**
 * La toma no tiene nombre: `expo-camera` devuelve una ruta de caché. Se arma uno
 * con la fecha para que el listado de adjuntos no muestre varias filas
 * indistinguibles.
 */
function nombreDeLaToma(): string {
  const ahora = new Date();
  const dosDigitos = (valor: number) => String(valor).padStart(2, '0');
  const fecha = [
    ahora.getFullYear(),
    dosDigitos(ahora.getMonth() + 1),
    dosDigitos(ahora.getDate()),
  ].join('');
  const hora = [dosDigitos(ahora.getHours()), dosDigitos(ahora.getMinutes())].join('');
  return `foto-${fecha}-${hora}.jpg`;
}

const estilos = StyleSheet.create({
  telon: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.35)' },
  panel: { overflow: 'hidden' },
  llena: { flex: 1 },
});
