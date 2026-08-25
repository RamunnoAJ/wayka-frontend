import { useEffect } from 'react';

import { intentarRefrescarToken } from '../lib/refresh';
import { limpiarSesion, obtenerSesion } from '../stores/sesion';

/**
 * Restaura la sesión al arrancar.
 *
 * El token de acceso vive solo en memoria, así que al abrir la app (o al
 * recargar la pestaña web) se pide uno nuevo con el token de refresco
 * (doc 08, sección 6). Si no hay token guardado, o el canje falla, la sesión
 * queda explícitamente vacía y los guards mandan a login.
 *
 * En web esto hoy nunca recupera nada: el token de refresco vive en memoria
 * mientras siga abierta la decisión de almacenamiento
 * (ver `src/lib/almacenamiento-refresh.ts`).
 */
export function useRestaurarSesion(): void {
  useEffect(() => {
    let vigente = true;
    if (obtenerSesion() !== undefined) return;

    intentarRefrescarToken()
      .catch(() => null)
      .then(() => {
        // Un canje exitoso ya dejó la sesión puesta; lo único que falta es
        // sacar el estado de "todavía no se intentó" cuando no había nada.
        if (vigente && obtenerSesion() === undefined) limpiarSesion();
      });

    return () => {
      vigente = false;
    };
  }, []);
}
