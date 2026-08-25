import { refrescar } from '../api/auth';
import { limpiarSesion, setSesion } from '../stores/sesion';

import {
  borrarTokenRefresco,
  guardarTokenRefresco,
  leerTokenRefresco,
} from './almacenamiento-refresh';
import { registrarRefrescador } from './http';

/**
 * Canje del token de refresco. Un 401 dispara **un solo** intento; si falla, se
 * limpia la sesión y el guard manda a login — nunca un reintento en loop
 * (doc 08, sección 6).
 *
 * Dónde vive el token de refresco lo decide `almacenamiento-refresh.ts`: en web
 * es memoria mientras la decisión siga abierta, así que ahí este flujo funciona
 * dentro de la misma carga de página y no sobrevive a un recargo.
 */

/**
 * Refrescos concurrentes comparten el mismo canje. Sin esto, dos requests que
 * reciben 401 al mismo tiempo presentarían el mismo token de refresco dos veces
 * y el backend leería el segundo como reuso — revocando la cadena entera y
 * dejando al usuario afuera (Arquitectura, 4.2.1).
 */
let enCurso: Promise<string | null> | null = null;

async function canjear(): Promise<string | null> {
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
  enCurso ??= canjear().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

// El cliente HTTP no importa este módulo: lo recibe registrado, para no cerrar
// un ciclo entre lib/http, api/auth y este archivo.
registrarRefrescador(intentarRefrescarToken);
