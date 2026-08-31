import type { Tutor } from '../../api/tutor';
import type { Clinica } from '../../api/clinica';

/**
 * El punto que alguien confirmó en el mapa. Los tres campos van juntos: el
 * `placeId` permite volver a consultar el lugar cuando una calle se renombra, y
 * el par lat/lng es lo que se muestra y lo que va a usar el matching
 * geolocalizado de Fase 2 (Modelo de Datos, 3.1).
 */
export interface PuntoEnElMapa {
  placeId: string;
  lat: number;
  lng: number;
}

/**
 * Una dirección tal como la maneja el formulario: el texto que se escribe y, si
 * se eligió una sugerencia, el punto. **Confirmar no es obligatorio** — una
 * dirección que el proveedor no conoce, o escrita sin conexión, viaja sin punto.
 */
export interface Direccion {
  texto: string;
  punto?: PuntoEnElMapa;
}

/**
 * Aplana la dirección a los campos del contrato.
 *
 * Sin punto manda **solo** el texto, y eso no es un olvido: es lo que hace que
 * el backend limpie el punto anterior (regla 2.6). Mandar los campos del punto
 * viejo junto al texto nuevo dejaría el pin en la casa de antes.
 */
export function cambioDeDireccion(direccion: Direccion): {
  direccion: string;
  direccion_place_id?: string;
  direccion_lat?: number;
  direccion_lng?: number;
} {
  const texto = direccion.texto.trim();
  if (!texto || !direccion.punto) {
    return { direccion: texto };
  }
  return {
    direccion: texto,
    direccion_place_id: direccion.punto.placeId,
    direccion_lat: direccion.punto.lat,
    direccion_lng: direccion.punto.lng,
  };
}

/** Lee la dirección de una ficha ya guardada hacia la forma del formulario. */
export function direccionDeFicha(ficha: Tutor | Clinica | undefined): Direccion {
  if (!ficha) return { texto: '' };

  const { direccion, direccion_place_id, direccion_lat, direccion_lng } = ficha;
  const punto =
    direccion_place_id != null && direccion_lat != null && direccion_lng != null
      ? { placeId: direccion_place_id, lat: direccion_lat, lng: direccion_lng }
      : undefined;
  return { texto: direccion ?? '', punto };
}

const MAPA_ANCHO = 640;
const MAPA_ALTO = 240;
const MAPA_ZOOM = 16;

/**
 * URL de una imagen de Google Static Maps con el pin en el punto.
 *
 * Es una imagen y no un mapa interactivo a propósito: `<Image source={{ uri }}>`
 * funciona igual en web y en nativo, sin dependencias nuevas ni una
 * implementación por plataforma. Alcanza para lo que la pantalla necesita —ver
 * que el pin cayó donde uno vive— y no permite arrastrarlo, que es la
 * contrapartida asumida.
 *
 * Devuelve null cuando no hay nada que mostrar: sin punto no hay dónde poner el
 * pin, y sin clave la URL saldría rechazada por Google y la pantalla mostraría
 * una imagen rota en vez de simplemente no mostrar el mapa.
 */
export function urlDeMapaEstatico(punto: PuntoEnElMapa | undefined, clave: string): string | null {
  if (!punto || !clave) return null;

  const centro = `${punto.lat},${punto.lng}`;
  const parametros = new URLSearchParams({
    center: centro,
    zoom: String(MAPA_ZOOM),
    size: `${MAPA_ANCHO}x${MAPA_ALTO}`,
    scale: '2',
    markers: `color:red|${centro}`,
    key: clave,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${parametros.toString()}`;
}
