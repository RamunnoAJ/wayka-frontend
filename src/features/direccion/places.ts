import { MAPAS_REGION } from '../../lib/config';

import type { Direccion } from './direccion';

/**
 * Cliente de Google Places (New), consultado **desde el cliente** y no desde el
 * backend (Arquitectura, 3.6). El backend recibe la sugerencia ya elegida y la
 * persiste tal cual: no vuelve a consultar a Google.
 *
 * Nada de acá lanza. El autocompletado es una ayuda sobre un campo de texto que
 * se puede guardar igual, así que un proveedor caído, una clave mal restringida
 * o un teléfono sin señal degradan a "no hay sugerencias" — nunca a un
 * formulario que no se puede enviar.
 */

const AUTOCOMPLETADO = 'https://places.googleapis.com/v1/places:autocomplete';
const DETALLE = 'https://places.googleapis.com/v1/places';

export interface Sugerencia {
  placeId: string;
  texto: string;
}

interface RespuestaDeAutocompletado {
  suggestions?: {
    placePrediction?: { placeId?: string; text?: { text?: string } };
  }[];
}

interface RespuestaDeDetalle {
  id?: string;
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
}

/**
 * `sesion` es el token que agrupa las pulsaciones del autocompletado con el
 * detalle que se pide al elegir una. Google factura la sesión entera como una
 * sola consulta; sin él, cada tecla se cobra suelta.
 */
export async function buscarSugerencias(
  entrada: string,
  sesion: string,
  clave: string,
): Promise<Sugerencia[]> {
  if (!clave || entrada.trim().length < 3) return [];

  try {
    const respuesta = await fetch(AUTOCOMPLETADO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': clave },
      body: JSON.stringify({
        input: entrada,
        sessionToken: sesion,
        includedRegionCodes: [MAPAS_REGION],
      }),
    });
    if (!respuesta.ok) return [];

    const cuerpo = (await respuesta.json()) as RespuestaDeAutocompletado;
    return (cuerpo.suggestions ?? []).flatMap((sugerencia) => {
      const prediccion = sugerencia.placePrediction;
      const placeId = prediccion?.placeId;
      const texto = prediccion?.text?.text;
      return placeId && texto ? [{ placeId, texto }] : [];
    });
  } catch {
    return [];
  }
}

/**
 * Trae la dirección normalizada y el punto del lugar elegido.
 *
 * Devuelve null si el lugar viene sin coordenadas: sin punto no hay nada que
 * confirmar, y guardar el texto normalizado con el punto vacío es exactamente
 * lo que ya hace escribir la dirección a mano.
 */
export async function detalleDeLugar(
  placeId: string,
  sesion: string,
  clave: string,
): Promise<Direccion | null> {
  if (!clave) return null;

  try {
    const url = `${DETALLE}/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sesion)}`;
    const respuesta = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': clave,
        'X-Goog-FieldMask': 'id,formattedAddress,location',
      },
    });
    if (!respuesta.ok) return null;

    const cuerpo = (await respuesta.json()) as RespuestaDeDetalle;
    const lat = cuerpo.location?.latitude;
    const lng = cuerpo.location?.longitude;
    if (!cuerpo.formattedAddress || lat == null || lng == null) return null;

    return {
      texto: cuerpo.formattedAddress,
      punto: { placeId: cuerpo.id ?? placeId, lat, lng },
    };
  } catch {
    return null;
  }
}
