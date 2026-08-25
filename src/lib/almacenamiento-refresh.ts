import * as SecureStore from 'expo-secure-store';

import { esWeb } from './plataforma';

/**
 * Único lugar donde se decide dónde vive el token de refresco.
 *
 * - **Nativo**: `expo-secure-store` (Keychain / Keystore). Resuelto.
 * - **Web**: **decisión abierta** (doc 08, sección 6; doc 09 no la toca).
 *   `localStorage` persiste pero es legible por cualquier script (XSS); una
 *   cookie `httpOnly` es más segura pero exige que el backend la setee en vez
 *   de devolver el token en el body, algo que Arquitectura 4.2 no contempla
 *   hoy. Hasta que se resuelva **el token de refresco en web vive en memoria**:
 *   la sesión funciona, pero se pierde al recargar la pestaña.
 *
 * Cerrar esa decisión es cambiar este módulo y nada más.
 */

const CLAVE = 'wayka.token-refresco';

/** Memoria del proceso: es el almacenamiento real en web, hasta que se decida. */
let enMemoria: string | null = null;

export async function guardarTokenRefresco(token: string): Promise<void> {
  if (esWeb) {
    enMemoria = token;
    return;
  }
  await SecureStore.setItemAsync(CLAVE, token);
}

export async function leerTokenRefresco(): Promise<string | null> {
  if (esWeb) return enMemoria;
  return SecureStore.getItemAsync(CLAVE);
}

export async function borrarTokenRefresco(): Promise<void> {
  if (esWeb) {
    enMemoria = null;
    return;
  }
  await SecureStore.deleteItemAsync(CLAVE);
}

/**
 * `true` si la sesión sobrevive a un reinicio de la app. En web es `false`
 * mientras la decisión siga abierta — la UI lo usa para no prometer al usuario
 * una persistencia que no existe.
 */
export const persisteEntreSesiones = !esWeb;
