import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, StyleSheet, View } from 'react-native';

import {
  CameraCapture,
  type EstadoDeCamara,
  type FlashDeCamara,
  type ModoDeCamara,
} from '../../components';
import type { ArchivoElegido } from '../../lib/archivos';
import { useTheme } from '../../theme';

/**
 * La cámara con la que el tutor saca la foto de una herida y el veterinario la
 * de un estudio en papel (Alcance de Plataformas, 3.4 y 5.6).
 *
 * Es lo que conecta `CameraCapture` —que es solo la interfaz— con `expo-camera`
 * y con el archivo que después sube `SubidaDeAdjunto`.
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
  /** Para qué se saca la foto: "Herida · Mora". */
  titulo?: string;
  onCerrar: () => void;
  /** La toma confirmada, lista para subir. */
  onTomada: (archivo: ArchivoElegido) => void;
  /** Abre el selector de archivos, para el que ya tiene la foto en el teléfono. */
  onAbrirCarrete?: () => void;
}

export function CamaraDeAdjunto({
  titulo,
  onCerrar,
  onTomada,
  onAbrirCarrete,
}: CamaraDeAdjuntoProps) {
  const { t } = useTheme();
  const camara = useRef<CameraView>(null);
  const [permiso, pedirPermiso] = useCameraPermissions();

  const [modo, setModo] = useState<ModoDeCamara>('foto');
  const [flash, setFlash] = useState<FlashDeCamara>('off');
  const [frontal, setFrontal] = useState(false);
  const [toma, setToma] = useState<CameraCapturedPicture | null>(null);
  const [sacando, setSacando] = useState(false);

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

  async function capturar() {
    if (!camara.current || sacando) return;
    setSacando(true);
    try {
      // exif en false: la foto de una herida no necesita llevar la ubicación de
      // la casa del tutor a un bucket. El backend guarda lo que le llega.
      const sacada = await camara.current.takePictureAsync({ quality: 0.85, exif: false });
      if (sacada) setToma(sacada);
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
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <View style={[estilos.raiz, { backgroundColor: t['--surface-nav-deep'] }]}>
        <CameraCapture
          framed={false}
          status={estado}
          mode={modo}
          flash={flash}
          title={titulo}
          previewSrc={toma?.uri}
          visor={
            estado === 'sin-permiso' ? undefined : (
              <CameraView
                ref={camara}
                style={estilos.visor}
                facing={frontal ? 'front' : 'back'}
                flash={flash}
              />
            )
          }
          onCapture={() => void capturar()}
          onRetake={() => setToma(null)}
          onConfirm={confirmar}
          onClose={onCerrar}
          onFlip={() => setFrontal((valor) => !valor)}
          onGallery={onAbrirCarrete}
          onModeChange={setModo}
          onFlashChange={setFlash}
          onOpenSettings={() => void Linking.openSettings()}
        />
      </View>
    </Modal>
  );
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
  raiz: { flex: 1 },
  visor: { flex: 1 },
});
