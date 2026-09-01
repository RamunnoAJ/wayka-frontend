import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { TIPOS_DE_ARCHIVO, type TipoDeArchivo } from '../components';

/**
 * Elección y validación previa de un archivo a adjuntar.
 *
 * Todo lo de acá **duplica una regla que el backend aplica igual** (`negocio/
 * adjunto.go`): existe para que el usuario no suba 8 MB por una red móvil y
 * recién ahí se entere de que el archivo no servía. La barrera sigue siendo el
 * backend; esto es la cortesía de avisar antes.
 */

/**
 * Techo por archivo, en MiB. El contrato lo declara en el `maxLength` de
 * `SubirAdjuntoRequest.archivo` y el backend lo aplica con la misma constante.
 *
 * Se sostiene a mano porque el contrato no viaja con la app: no hay de dónde
 * leerlo en tiempo de ejecución. Lo que impide la deriva es `contrato.test.ts`,
 * que compara este número contra el YAML del backend y falla si se separan.
 */
export const TAMANO_MAXIMO_MB = 10;
const TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024;

export interface ArchivoElegido {
  /** Ruta local (`file://`, `content://`) o blob URL en web. */
  uri: string;
  nombre: string;
  /** Lo que declara el dispositivo. El backend detecta el real y manda el suyo. */
  contentType: string;
  tamanoBytes: number;
  /** En web el picker ya devuelve el `File`, que es lo que viaja en el FormData. */
  archivoWeb?: File;
}

/**
 * De dónde sale el archivo. No es lo mismo en iOS: el selector de documentos
 * abre la app Archivos, donde las fotos del teléfono **no están** — el carrete
 * es otro selector distinto.
 */
export type FuenteDeArchivo = 'carrete' | 'archivos';

/**
 * Abre el selector que corresponda a la fuente. Devuelve `null` si el usuario
 * canceló, que no es un error y no se le avisa.
 */
export async function elegirArchivo(
  tipo: TipoDeArchivo,
  fuente: FuenteDeArchivo = 'archivos',
): Promise<ArchivoElegido | null> {
  return fuente === 'carrete' ? elegirDelCarrete() : elegirDeArchivos(tipo);
}

/** El selector de documentos: la app Archivos en iOS, el de siempre. */
async function elegirDeArchivos(tipo: TipoDeArchivo): Promise<ArchivoElegido | null> {
  const resultado = await DocumentPicker.getDocumentAsync({
    type: TIPOS_DE_ARCHIVO[tipo].accept.split(','),
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (resultado.canceled) return null;
  const elegido = resultado.assets[0];
  if (!elegido) return null;

  return {
    uri: elegido.uri,
    nombre: elegido.name,
    contentType: elegido.mimeType ?? 'application/octet-stream',
    tamanoBytes: elegido.size ?? 0,
    archivoWeb: elegido.file,
  };
}

/**
 * El carrete. Solo imágenes: en la biblioteca de fotos no hay PDFs, así que un
 * "estudio" que sea informe en papel escaneado sigue saliendo de Archivos.
 *
 * No pide permiso a mano: el selector de fotos del sistema (PHPicker en iOS,
 * el Photo Picker en Android) corre fuera de la app y devuelve solo lo que el
 * usuario eligió, sin acceso a la biblioteca entera.
 */
async function elegirDelCarrete(): Promise<ArchivoElegido | null> {
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    // exif en false por lo mismo que en la cámara: la foto de una herida no
    // tiene por qué llevar la ubicación de la casa del tutor a un bucket.
    exif: false,
  });

  if (resultado.canceled) return null;
  const elegido = resultado.assets[0];
  if (!elegido) return null;

  return {
    uri: elegido.uri,
    // El carrete no siempre da nombre (una foto de iCloud puede venir sin él).
    nombre: elegido.fileName ?? nombreDeRespaldo(elegido.mimeType),
    contentType: elegido.mimeType ?? 'image/jpeg',
    tamanoBytes: elegido.fileSize ?? 0,
    archivoWeb: elegido.file,
  };
}

/**
 * Pregunta de dónde sacar el archivo cuando el tipo admite las dos fuentes.
 * `null` = el usuario cerró sin elegir.
 *
 * Usa el diálogo del sistema y no un componente propio a propósito: es el paso
 * previo a otro diálogo del sistema, y encadenar dos hojas nuestras sobre el
 * selector nativo se lee como una pantalla de más.
 */
export function preguntarFuente(): Promise<FuenteDeArchivo | null> {
  const opciones = ['Elegir del carrete', 'Elegir un archivo', 'Cancelar'];

  if (Platform.OS === 'ios') {
    return new Promise((resolver) => {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: opciones, cancelButtonIndex: 2 },
        (indice) => resolver(indice === 0 ? 'carrete' : indice === 1 ? 'archivos' : null),
      );
    });
  }

  // Android no tiene hoja de acción nativa; `Alert` con tres botones es el
  // equivalente y evita traer una dependencia por un menú de dos opciones.
  return new Promise((resolver) => {
    Alert.alert(
      'Adjuntar un estudio',
      'La placa está en el carrete; el informe escaneado, entre los archivos.',
      [
        { text: opciones[0], onPress: () => resolver('carrete') },
        { text: opciones[1], onPress: () => resolver('archivos') },
        { text: opciones[2], style: 'cancel', onPress: () => resolver(null) },
      ],
      { cancelable: true, onDismiss: () => resolver(null) },
    );
  });
}

/** `foto-...jpg` para la toma del carrete que viene sin nombre. */
function nombreDeRespaldo(contentType: string | undefined): string {
  const extension = contentType?.split('/')[1]?.split('+')[0] ?? 'jpg';
  return `foto-${Date.now()}.${extension}`;
}

/**
 * Motivo por el que el backend va a rechazar el archivo, o `null` si pasa.
 *
 * El tipo se compara contra lo que declara el dispositivo, que **no es lo que
 * el backend mira**: allá se detecta del contenido (`http.DetectContentType`).
 * Un archivo con la extensión cambiada pasa este control y falla en el
 * servidor, y está bien que así sea — acá no se puede leer el contenido sin
 * cargarlo entero en memoria, que es justo lo que se quiere evitar.
 */
export function motivoDeRechazo(archivo: ArchivoElegido, tipo: TipoDeArchivo): string | null {
  if (archivo.tamanoBytes > TAMANO_MAXIMO_BYTES) {
    return `Supera el límite de ${TAMANO_MAXIMO_MB} MB`;
  }

  const esImagen = archivo.contentType.startsWith('image/');
  const esPDF = archivo.contentType === 'application/pdf';
  const admitido = tipo === 'foto' ? esImagen : tipo === 'pdf' ? esPDF : esImagen || esPDF;

  if (!admitido) {
    return `Ese archivo no es ${TIPOS_DE_ARCHIVO[tipo].humano}`;
  }
  return null;
}

/** `1258291` → `"1,2 MB"`. Mismo formato que el listado de la ficha. */
export function tamanoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
