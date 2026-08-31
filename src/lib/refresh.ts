import { refrescar } from '../api/auth';
import { limpiarSesion, setSesion } from '../stores/sesion';

import {
  borrarTokenRefresco,
  guardarTokenRefresco,
  leerTokenRefresco,
} from './almacenamiento-refresh';
import { destruirBaseLocal } from './base-local';
import { registrarRefrescador } from './http';

/**
 * Canje del token de refresco. Un 401 dispara **un solo** intento; si falla, se
 * limpia la sesión y el guard manda a login — nunca un reintento en loop
 * (doc 08, sección 6).
 *
 * Dónde vive el token de refresco lo decide `almacenamiento-refresh.ts`.
 */

/**
 * Refrescos concurrentes comparten el mismo canje. Sin esto, dos requests que
 * reciben 401 al mismo tiempo presentarían el mismo token de refresco dos veces
 * y el backend leería el segundo como reuso — revocando la cadena entera y
 * dejando al usuario afuera (Arquitectura, 4.2.1).
 */
let enCurso: Promise<string | null> | null = null;

/** Nombre del candado entre pestañas. Es del origen, no de esta carga. */
const CANDADO = 'wayka.refresh';

/**
 * Serializa el canje **entre pestañas** del mismo navegador.
 *
 * `enCurso` alcanza dentro de una carga de página, pero desde que el token vive
 * en `localStorage` lo comparten todas las pestañas abiertas: dos que reciben
 * 401 a la vez presentarían el mismo token y la segunda dispararía la detección
 * de reuso, tirando abajo la sesión de las dos. El candado las pone en fila, y
 * como el token se lee **adentro**, la segunda ya encuentra el rotado.
 *
 * `navigator.locks` no está en todos los navegadores; donde no está, se corre
 * sin candado y queda el comportamiento anterior.
 */
async function conCandado<T>(tarea: () => Promise<T>): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.locks) return tarea();
  return navigator.locks.request(CANDADO, tarea);
}

async function canjear(): Promise<string | null> {
  // Se lee acá adentro y no antes de pedir el candado: mientras se esperaba, la
  // otra pestaña pudo haber rotado el token, y el de antes ya no vale.
  const tokenRefresco = await leerTokenRefresco();
  if (!tokenRefresco) return null;

  try {
    const { sesion, tokenRefresco: rotado } = await refrescar(tokenRefresco);
    // El token rotado reemplaza al usado antes de que nadie más pueda leerlo.
    await guardarTokenRefresco(rotado);
    setSesion(sesion);
    return sesion.tokenAcceso;
  } catch {
    // Token inválido, reuso detectado o Usuario.activo = false: no hay sesión
    // que salvar.
    //
    // La copia local se va con ella. Es lo que acota cuánto tiempo un
    // dispositivo puede seguir mostrando datos clínicos sin volver a demostrar
    // que la sesión sigue viva: el vencimiento del token de acceso no bloquea la
    // lectura offline —sería inutilizable—, pero el del refresco sí (doc 11, 8).
    await destruirBaseLocal();
    await borrarTokenRefresco();
    limpiarSesion();
    return null;
  }
}

/**
 * Devuelve un token de acceso nuevo, o `null` si no se pudo refrescar (en cuyo
 * caso la sesión ya quedó limpia y quien llamó debe propagar el 401 original).
 */
export async function intentarRefrescarToken(): Promise<string | null> {
  enCurso ??= conCandado(canjear).finally(() => {
    enCurso = null;
  });
  return enCurso;
}

// El cliente HTTP no importa este módulo: lo recibe registrado, para no cerrar
// un ciclo entre lib/http, api/auth y este archivo.
registrarRefrescador(intentarRefrescarToken);
