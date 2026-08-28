import { router } from 'expo-router';
import { useEffect } from 'react';

import { RUTA_LOGIN } from '../constants/roles';
import { CLAVE_DEL_TOKEN } from '../lib/almacenamiento-refresh';
import { esWeb } from '../lib/plataforma';
import { limpiarSesion, obtenerSesion } from '../stores/sesion';

/**
 * Propaga el cierre de sesión al resto de las pestañas del navegador.
 *
 * Desde que el token de refresco vive en `localStorage` (doc 08, sección 6) lo
 * comparten todas las pestañas del mismo origen. Cerrar sesión en una borra el
 * token, pero las otras se quedaban con su token de acceso en memoria y seguían
 * usables hasta que ese venciera: minutos con la ficha de un paciente abierta en
 * una máquina de la que el usuario ya se fue.
 *
 * El evento `storage` **solo llega a las otras pestañas**, nunca a la que hizo
 * el cambio, así que no hay que distinguir quién lo originó.
 *
 * En nativo no aplica: no hay pestañas, y `expo-secure-store` no emite eventos.
 */
export function useSesionEntrePestanas(): void {
  useEffect(() => {
    if (!esWeb || typeof window === 'undefined') return;

    function alCambiarElAlmacenamiento(evento: StorageEvent) {
      if (evento.key !== CLAVE_DEL_TOKEN) return;

      // Solo el borrado cierra la sesión. Un valor nuevo es la rotación normal
      // de otra pestaña que refrescó, y ahí no hay nada que hacer: el próximo
      // canje lee el token de vuelta del almacenamiento.
      if (evento.newValue !== null) return;

      // Sin sesión en esta pestaña no hay nada que cerrar, y redirigir sería
      // sacar de la pantalla de login a alguien que está escribiendo su
      // contraseña.
      if (!obtenerSesion()) return;

      limpiarSesion();
      router.replace(RUTA_LOGIN);
    }

    window.addEventListener('storage', alCambiarElAlmacenamiento);
    return () => window.removeEventListener('storage', alCambiarElAlmacenamiento);
  }, []);
}
