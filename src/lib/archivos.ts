import * as DocumentPicker from 'expo-document-picker';

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
 * Abre el selector del sistema. Devuelve `null` si el usuario canceló, que no
 * es un error y no se le avisa.
 */
export async function elegirArchivo(tipo: TipoDeArchivo): Promise<ArchivoElegido | null> {
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
