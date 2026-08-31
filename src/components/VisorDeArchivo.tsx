import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { duracion, resorte, useTheme } from '../theme';

import { Button } from './Button';
import { Icon, type NombreDeIcono } from './Icon';
import { IconButton } from './IconButton';
import { InlineError } from './InlineError';

/**
 * Mirar un adjunto sin salir de la ficha.
 *
 * Un adjunto es un archivo en un bucket privado: lo único que el cliente tiene
 * es una URL prefirmada de vida corta (Reglas de Negocio, 4.14.4). El visor no
 * descarga nada al dispositivo — muestra lo que se puede mostrar y, para lo que
 * no, delega en el sistema.
 *
 * **Solo las imágenes se ven acá adentro.** Un PDF necesita un motor de
 * renderizado que este stack no tiene, y meterlo por un WebView significaría
 * pasarle la URL firmada a un navegador embebido para que la cachee por su
 * cuenta. Para todo lo que no sea imagen, la acción es abrirlo con el visor del
 * sistema, que es el que ya sabe hacerlo.
 *
 * El componente **no pide el archivo**: recibe la URL ya resuelta, porque quien
 * la pide es quien sabe que hay que pedirla de nuevo cuando vence.
 */

/** Hasta dónde deja acercarse el pinch. Más que esto ya es solo grano. */
const ESCALA_MAXIMA = 5;

/** Cuánto acerca el doble toque, que es el atajo al pinch de dos dedos. */
const ESCALA_DEL_DOBLE_TOQUE = 2.5;

/** Rectángulo de la miniatura en la pantalla: de ahí sale el visor y ahí vuelve. */
export interface RectanguloEnPantalla {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VisorDeArchivoProps {
  /** Nombre con el que se subió, que es como el usuario lo reconoce. */
  nombre: string;
  /** El que midió el servidor, no el que declaró el cliente. */
  contentType: string;
  /** Peso ya formateado por quien lo usa: "1,2 MB". */
  tamano?: string;
  /**
   * URL prefirmada. `undefined` mientras se está resolviendo: el visor abre
   * igual, con el nombre a la vista, en vez de esperar para recién ahí aparecer.
   */
  url?: string;
  cargando?: boolean;
  /** No se pudo resolver la URL. Sin esto, un fallo se vería como carga eterna. */
  error?: boolean;
  /**
   * De dónde sale el visor: la miniatura que se tocó. Sin esto la apertura es
   * solo un fundido, que es lo correcto cuando no hay un origen visible — el
   * chip de texto del historial no tiene de dónde crecer.
   */
  origen?: RectanguloEnPantalla;
  onReintentar?: () => void;
  onCerrar: () => void;
}

/**
 * Qué se puede dibujar en un `<Image>`. Se mira el content type **del servidor**
 * y no el `tipo` declarado: un adjunto de tipo `estudio` puede ser tanto un PDF
 * como una imagen, y el tipo no lo distingue.
 *
 * Los formatos que el visor nativo no sabe dibujar (HEIC) no llegan hasta acá:
 * el backend guarda un JPEG equivalente al subir y sirve ese
 * (`derivarVistaPrevia`, `negocio/adjunto.go`).
 */
export function esImagenMostrable(contentType: string): boolean {
  return contentType.startsWith('image/');
}

export function iconoDeContentType(contentType: string): NombreDeIcono {
  if (esImagenMostrable(contentType)) return 'image';
  if (contentType === 'application/pdf') return 'file-text';
  return 'paperclip';
}

export function VisorDeArchivo({
  nombre,
  contentType,
  tamano,
  url,
  cargando = false,
  error = false,
  origen,
  onReintentar,
  onCerrar,
}: VisorDeArchivoProps) {
  const { t, px, texto } = useTheme();
  const { width: anchoDePantalla, height: altoDePantalla } = useWindowDimensions();
  const reducido = useReducedMotion();
  const [falloLaImagen, setFalloLaImagen] = useState(false);

  const esImagen = esImagenMostrable(contentType);

  // 0 = todavía en la miniatura, 1 = abierto del todo. La regla de reparto del
  // sistema (Movimiento, sección 1) manda resorte para `transform` y timing
  // para `opacity`, así que son dos valores y no uno: arrancan y terminan
  // juntos, pero no con la misma curva.
  const apertura = useSharedValue(reducido ? 1 : 0);
  const opacidad = useSharedValue(reducido ? 1 : 0);

  // El cierre no puede desmontar y listo: hay que devolver la imagen a su
  // tarjeta y recién ahí sacar el modal. Desmontarlo primero es exactamente el
  // corte que la animación existe para evitar.
  const cerrarConAnimacion = useCallback(() => {
    if (reducido) {
      onCerrar();
      return;
    }
    opacidad.set(withTiming(0, duracion.fast));
    apertura.set(
      withSpring(0, resorte.snap, (terminada) => {
        if (terminada) runOnJS(onCerrar)();
      }),
    );
  }, [apertura, opacidad, onCerrar, reducido]);

  useEffect(() => {
    if (reducido) return;
    apertura.set(withSpring(1, resorte.gentle));
    opacidad.set(withTiming(1, duracion.normal));
  }, [apertura, opacidad, reducido]);

  const estiloDelFondo = useAnimatedStyle(() => ({ opacity: opacidad.get() }));

  /**
   * De la tarjeta a la pantalla. Se escala por el ancho y no por el mayor de
   * los dos lados: la miniatura es una banda apaisada y tomar el alto la
   * estiraría de más al empezar.
   */
  const estiloDeLaSalida = useAnimatedStyle(() => {
    if (!origen) return {};
    const escalaInicial = origen.width / anchoDePantalla;
    const desdeX = origen.x + origen.width / 2 - anchoDePantalla / 2;
    const desdeY = origen.y + origen.height / 2 - altoDePantalla / 2;
    const p = apertura.get();
    return {
      transform: [
        { translateX: desdeX * (1 - p) },
        { translateY: desdeY * (1 - p) },
        { scale: escalaInicial + (1 - escalaInicial) * p },
      ],
    };
  });

  return (
    <Modal
      visible
      // El movimiento lo maneja el visor: la animación propia del Modal se
      // sumaría a la de la imagen y se leerían dos desplazamientos distintos.
      animationType="none"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={cerrarConAnimacion}
      statusBarTranslucent
    >
      {/* El Modal se monta en una jerarquía nativa aparte, fuera del root que
          instala la navegación: sin este envoltorio los gestos no llegan. */}
      <GestureHandlerRootView style={estilos.raiz}>
        <Animated.View
          style={[estilos.raiz, estiloDelFondo, { backgroundColor: t['--surface-immersive'] }]}
        >
          <View style={estilos.barra}>
            <View style={estilos.identidad}>
              <Text
                numberOfLines={1}
                style={[texto('body-strong'), { color: t['--text-on-immersive'] }]}
              >
                {nombre}
              </Text>
              {tamano ? (
                <Text style={[texto('caption'), { color: t['--text-on-immersive-muted'] }]}>
                  {tamano}
                </Text>
              ) : null}
            </View>
            <IconButton
              icon="x"
              label="Cerrar la vista previa"
              variant="on-dark"
              onPress={cerrarConAnimacion}
            />
          </View>

          <Animated.View style={[estilos.lienzo, estiloDeLaSalida]}>
            {error ? (
              <View style={{ padding: px('--gutter-card') }}>
                <InlineError title="No se pudo abrir el archivo" onRetry={onReintentar} />
              </View>
            ) : cargando || !url ? (
              <ActivityIndicator color={t['--text-on-immersive']} />
            ) : esImagen && !falloLaImagen ? (
              <ImagenConZoom url={url} nombre={nombre} onFallo={() => setFalloLaImagen(true)} />
            ) : (
              <SinVistaPrevia
                contentType={contentType}
                // Una imagen que no cargó no es "un formato que no se muestra":
                // decirle eso al usuario lo manda a buscar el problema al lado
                // equivocado.
                motivo={
                  falloLaImagen
                    ? 'La imagen no se pudo cargar. Puede que el enlace haya vencido.'
                    : 'Este formato no se muestra acá adentro.'
                }
                url={url}
              />
            )}
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const ImagenAnimada = Animated.createAnimatedComponent(Image);

/**
 * La imagen con pinch para acercar y arrastre para recorrerla.
 *
 * **Solo se arrastra cuando está acercada.** Con la imagen entera en pantalla
 * no hay nada fuera del cuadro, y dejarla mover sería llevarla a donde no está
 * mirando nadie.
 *
 * El doble toque es el atajo: acerca a un valor fijo o vuelve al encuadre
 * completo. Existe porque el pinch pide dos dedos, y una foto clínica se mira
 * muchas veces con el teléfono en una mano.
 *
 * El arrastre **no se acota a los bordes** de la imagen: para eso haría falta
 * su tamaño real en pantalla, que depende de la relación de aspecto del archivo
 * y no se conoce sin medirla. Soltar fuera de foco vuelve al centro, que
 * resuelve el mismo problema —quedarse mirando el vacío— sin esa medición.
 */
function ImagenConZoom({
  url,
  nombre,
  onFallo,
}: {
  url: string;
  nombre: string;
  onFallo: () => void;
}) {
  const reducido = useReducedMotion();

  const escala = useSharedValue(1);
  const escalaAlEmpezar = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const xAlEmpezar = useSharedValue(0);
  const yAlEmpezar = useSharedValue(0);

  const volverAlEncuadre = () => {
    'worklet';
    escala.set(withSpring(1, resorte.snap));
    x.set(withSpring(0, resorte.snap));
    y.set(withSpring(0, resorte.snap));
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      escalaAlEmpezar.set(escala.get());
    })
    .onUpdate((evento) => {
      const propuesta = escalaAlEmpezar.get() * evento.scale;
      // Por debajo de 1 el gesto se deja hacer para que se sienta elástico; el
      // encuadre completo se restituye al soltar, no durante.
      escala.set(Math.min(Math.max(propuesta, 0.6), ESCALA_MAXIMA));
    })
    .onEnd(() => {
      if (escala.get() < 1) volverAlEncuadre();
    });

  const arrastre = Gesture.Pan()
    .onStart(() => {
      xAlEmpezar.set(x.get());
      yAlEmpezar.set(y.get());
    })
    .onUpdate((evento) => {
      if (escala.get() <= 1) return;
      x.set(xAlEmpezar.get() + evento.translationX);
      y.set(yAlEmpezar.get() + evento.translationY);
    })
    .onEnd(() => {
      if (escala.get() <= 1) volverAlEncuadre();
    });

  const dobleToque = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (escala.get() > 1) {
        volverAlEncuadre();
        return;
      }
      escala.set(withSpring(ESCALA_DEL_DOBLE_TOQUE, resorte.snap));
    });

  // Pinch y arrastre a la vez: acercar con dos dedos casi siempre los mueve
  // también, y tratarlos como excluyentes obligaría a soltar y volver a agarrar.
  const gestos = Gesture.Race(dobleToque, Gesture.Simultaneous(pinch, arrastre));

  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: escala.get() }],
  }));

  // Con movimiento reducido la imagen queda quieta y sin zoom: el pinch es
  // movimiento continuo bajo el dedo, que es justo lo que el ajuste pide evitar.
  if (reducido) {
    return (
      <Image
        source={{ uri: url }}
        style={estilos.imagen}
        resizeMode="contain"
        accessibilityLabel={nombre}
        onError={onFallo}
      />
    );
  }

  return (
    <GestureDetector gesture={gestos}>
      <ImagenAnimada
        source={{ uri: url }}
        style={[estilos.imagen, estilo]}
        resizeMode="contain"
        accessibilityLabel={nombre}
        onError={onFallo}
      />
    </GestureDetector>
  );
}

function SinVistaPrevia({
  contentType,
  motivo,
  url,
}: {
  contentType: string;
  motivo: string;
  url: string;
}) {
  const { t, texto } = useTheme();

  return (
    <View style={estilos.sinVista}>
      <Icon name={iconoDeContentType(contentType)} size={44} color={t['--text-on-immersive']} />
      <Text style={[texto('body'), estilos.centrado, { color: t['--text-on-immersive-muted'] }]}>
        {motivo}
      </Text>
      <Button
        variant="secondary"
        iconLeft="external-link"
        onPress={() => void Linking.openURL(url)}
      >
        {Platform.OS === 'web' ? 'Abrir en una pestaña' : 'Abrir con el sistema'}
      </Button>
    </View>
  );
}

/**
 * La miniatura de una tarjeta de adjunto. Dibuja el archivo cuando es una
 * imagen y cae al icono cuando no —o cuando la URL ya venció, que en un listado
 * abierto hace rato es lo habitual y no es un error que valga la pena mostrar.
 *
 * **Se mide al apoyar el dedo, no al soltarlo**: el visor sale de donde está la
 * miniatura y para eso necesita su rectángulo en la pantalla, que solo se
 * consigue con una medición asincrónica. Midiendo en `onPressIn` el resultado
 * ya llegó cuando el toque se completa, y la apertura sigue siendo sincrónica
 * — encadenarla al callback de la medición la dejaría a merced de que ese
 * callback llegue, y una medición que no vuelve se comería el toque entero.
 */
interface MiniaturaDeArchivoProps {
  contentType: string;
  url?: string;
  /** Alternativo del icono cuando no hay imagen que mostrar. */
  icono: NombreDeIcono;
  alto: number;
  /** Abre el visor. Responde igual al toque y al mantener apretado. */
  onAbrir?: (origen?: RectanguloEnPantalla) => void;
  accessibilityLabel?: string;
}

export function MiniaturaDeArchivo({
  contentType,
  url,
  icono,
  alto,
  onAbrir,
  accessibilityLabel,
}: MiniaturaDeArchivoProps) {
  const { t } = useTheme();
  const contenedor = useRef<View>(null);
  const ultimaMedicion = useRef<RectanguloEnPantalla | undefined>(undefined);
  const [fallo, setFallo] = useState(false);

  const hayImagen = Boolean(url) && esImagenMostrable(contentType) && !fallo;

  const medir = useCallback(() => {
    contenedor.current?.measureInWindow?.((x, y, width, height) => {
      ultimaMedicion.current = width && height ? { x, y, width, height } : undefined;
    });
  }, []);

  // Sin medición —el primer toque de un teclado, un entorno sin layout— se abre
  // igual, con fundido en lugar de saliendo de la tarjeta.
  const abrir = useCallback(() => onAbrir?.(ultimaMedicion.current), [onAbrir]);

  return (
    <Pressable
      ref={contenedor}
      accessibilityRole={onAbrir ? 'button' : 'image'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={onAbrir ? 'Abre el archivo' : undefined}
      onPressIn={onAbrir ? medir : undefined}
      onPress={onAbrir ? abrir : undefined}
      onLongPress={onAbrir ? abrir : undefined}
      style={[estilos.miniatura, { height: alto, backgroundColor: t['--surface-sunken'] }]}
    >
      {hayImagen ? (
        <Image
          source={{ uri: url }}
          style={estilos.llena}
          resizeMode="cover"
          onError={() => setFallo(true)}
        />
      ) : (
        <Icon name={icono} size={26} color={t['--text-subtle']} />
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  identidad: { flex: 1, gap: 2 },
  lienzo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagen: { width: '100%', height: '100%' },
  llena: { width: '100%', height: '100%' },
  sinVista: { alignItems: 'center', gap: 14, paddingHorizontal: 32, maxWidth: 420 },
  centrado: { textAlign: 'center' },
  miniatura: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
