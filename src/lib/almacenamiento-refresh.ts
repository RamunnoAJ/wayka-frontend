import * as SecureStore from 'expo-secure-store';

import { esWeb } from './plataforma';

/**
 * Único lugar donde se decide dónde vive el token de refresco.
 *
 * - **Nativo**: `expo-secure-store` (Keychain / Keystore).
 * - **Web**: `localStorage`.
 *
 * La decisión de web estuvo abierta un tiempo entre `localStorage` y una cookie
 * `httpOnly`. Se eligió `localStorage`: la cookie es más segura pero exige que
 * el backend la setee en vez de devolver el token en el body, y eso no es lo que
 * describe Arquitectura 4.2 — cambiarlo movía el contrato de autenticación
 * entero para el MVP.
 *
 * **El riesgo aceptado es XSS**: cualquier script que corra en la página puede
 * leer `localStorage`. Lo que lo acota no es el almacenamiento sino el esquema
 * que ya existe del lado del backend — el token de refresco es de **un solo
 * uso** y rota en cada canje, y presentar uno ya usado se lee como reuso y
 * revoca la cadena entera (Arquitectura, 4.2.1). Un token robado sirve hasta
 * que el dueño refresque, y ahí las dos sesiones se caen.
 */

/**
 * Clave del token en el almacenamiento. Se exporta porque el aviso entre
 * pestañas (`useSesionEntrePestanas`) escucha cambios sobre ella: si la clave
 * viviera en dos lugares, renombrarla rompería el aviso en silencio.
 */
export const CLAVE_DEL_TOKEN = 'wayka.token-refresco';

const CLAVE = CLAVE_DEL_TOKEN;

/**
 * Respaldo para cuando `localStorage` no está.
 *
 * Pasa en dos casos reales: durante la exportación estática, que corre en Node
 * sin `window`, y en Safari en navegación privada, donde `setItem` lanza por
 * cuota. En los dos, la sesión sigue funcionando dentro de la misma carga de
 * página en vez de romperse.
 */
let enMemoria: string | null = null;

function almacenDelNavegador(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function guardarTokenRefresco(token: string): Promise<void> {
  if (!esWeb) {
    await SecureStore.setItemAsync(CLAVE, token);
    return;
  }

  enMemoria = token;
  try {
    almacenDelNavegador()?.setItem(CLAVE, token);
  } catch {
    // Sin cuota. Queda el respaldo en memoria.
  }
}

export async function leerTokenRefresco(): Promise<string | null> {
  if (!esWeb) return SecureStore.getItemAsync(CLAVE);

  try {
    // Lo guardado gana sobre la copia en memoria: otra pestaña pudo haber
    // rotado el token, y el de memoria quedaría viejo.
    const guardado = almacenDelNavegador()?.getItem(CLAVE);
    if (guardado) return guardado;
  } catch {
    // Cae al respaldo.
  }
  return enMemoria;
}

export async function borrarTokenRefresco(): Promise<void> {
  if (!esWeb) {
    await SecureStore.deleteItemAsync(CLAVE);
    return;
  }

  enMemoria = null;
  try {
    almacenDelNavegador()?.removeItem(CLAVE);
  } catch {
    // Nada que borrar.
  }
}
