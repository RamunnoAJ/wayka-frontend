import { obtenerTokenAcceso } from '../stores/sesion';

import { API_PREFIJO, API_URL } from './config';
import { ErrorApi, ErrorDeRed } from './errores';

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Quien sabe refrescar la sesión se registra acá en lugar de importarse.
 *
 * Es para no cerrar un ciclo de módulos: `refresh.ts` necesita `api/auth.ts`
 * para llamar al endpoint, y `api/auth.ts` necesita este cliente. Importarlo
 * directo deja `intentarRefrescarToken` sin inicializar según el orden en que
 * el bundler resuelva el ciclo. Lo registra `registrarRefrescador()` al
 * arrancar la app.
 *
 * Sin refrescador registrado, un 401 se propaga tal cual: es el comportamiento
 * correcto para un cliente que todavía no tiene sesión.
 */
type Refrescador = () => Promise<string | null>;

let refrescador: Refrescador | null = null;

export function registrarRefrescador(fn: Refrescador): void {
  refrescador = fn;
}

interface OpcionesRequest {
  /** Cuerpo JSON. Se serializa acá; no pasar un string ya serializado. */
  body?: unknown;
  /** Query string. Los `undefined` se omiten. */
  params?: Record<string, string | number | boolean | undefined>;
  /** Omite el header Authorization (login, registro, renovación de token). */
  publico?: boolean;
  signal?: AbortSignal;
}

function construirUrl(ruta: string, params?: OpcionesRequest['params']): string {
  const url = new URL(`${API_PREFIJO}${ruta}`, API_URL);
  if (params) {
    for (const [clave, valor] of Object.entries(params)) {
      if (valor !== undefined) url.searchParams.set(clave, String(valor));
    }
  }
  return url.toString();
}

async function leerCuerpo(respuesta: Response): Promise<unknown> {
  if (respuesta.status === 204) return null;
  const texto = await respuesta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

async function ejecutar(
  metodo: Metodo,
  ruta: string,
  opciones: OpcionesRequest,
  token: string | null,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opciones.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token && !opciones.publico) headers.Authorization = `Bearer ${token}`;

  // Sin `credentials: 'include'`: el backend no habilita credenciales en CORS
  // y el navegador rechazaría la respuesta. El token va siempre en Authorization.
  try {
    return await fetch(construirUrl(ruta, opciones.params), {
      method: metodo,
      headers,
      body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
      signal: opciones.signal,
    });
  } catch (causa) {
    throw new ErrorDeRed(causa);
  }
}

/**
 * Cliente HTTP base. Todo módulo de `/src/api` pasa por acá.
 *
 * Ante un 401 hace **un solo** intento de refresh y reintenta el request
 * original — nunca un loop (Arq. Frontend, sección 6). Hoy ese refresh es un
 * placeholder que siempre falla (ver `refresh.ts`), así que en la práctica el
 * 401 se propaga; la forma del flujo ya está acá para no rehacerla después.
 */
async function request<T>(
  metodo: Metodo,
  ruta: string,
  opciones: OpcionesRequest = {},
): Promise<T> {
  let respuesta = await ejecutar(metodo, ruta, opciones, obtenerTokenAcceso());

  if (respuesta.status === 401 && !opciones.publico && refrescador) {
    const tokenNuevo = await refrescador();
    if (tokenNuevo) {
      respuesta = await ejecutar(metodo, ruta, opciones, tokenNuevo);
    }
  }

  const cuerpo = await leerCuerpo(respuesta);
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, cuerpo);
  }
  return cuerpo as T;
}

export const http = {
  get: <T>(ruta: string, opciones?: OpcionesRequest) => request<T>('GET', ruta, opciones),
  post: <T>(ruta: string, opciones?: OpcionesRequest) => request<T>('POST', ruta, opciones),
  put: <T>(ruta: string, opciones?: OpcionesRequest) => request<T>('PUT', ruta, opciones),
  patch: <T>(ruta: string, opciones?: OpcionesRequest) => request<T>('PATCH', ruta, opciones),
  delete: <T>(ruta: string, opciones?: OpcionesRequest) => request<T>('DELETE', ruta, opciones),
};
