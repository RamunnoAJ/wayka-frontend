import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { cerrarSesion } from '../../api/auth';
import { RUTA_LOGIN } from '../../constants/roles';
import { borrarTokenRefresco, leerTokenRefresco } from '../../lib/almacenamiento-refresh';
import { limpiarSesion } from '../../stores/sesion';

/**
 * Cierra la sesión.
 *
 * Cerrar sesión es **revocar el token de refresco en el backend**, no solo
 * borrar el token de acceso del cliente: eso deja viva la cadena de
 * renovaciones. El token de acceso vigente sigue valiendo hasta expirar
 * (minutos), que es la ventana de revocación asumida por el esquema.
 *
 * Si la llamada falla igual se limpia el estado local: dejar al usuario
 * "adentro" porque el servidor no contestó es peor que una cadena que queda
 * viva hasta vencer.
 */
export function useCerrarSesion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const tokenRefresco = await leerTokenRefresco();
      if (tokenRefresco) await cerrarSesion(tokenRefresco);
    },
    onSettled: async () => {
      await borrarTokenRefresco();
      limpiarSesion();
      queryClient.clear();
      router.replace(RUTA_LOGIN);
    },
  });
}
