import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PLATAFORMA_DE_DISPOSITIVO, type PlataformaDeDispositivo } from '../../api/dispositivo';
import { esWeb } from '../../lib/plataforma';

/**
 * Lo que hace falta del sistema operativo para que lleguen los avisos: el
 * permiso y el token que el proveedor le asigna a esta instalación.
 *
 * El backend manda por **Expo Push** (`internal/notificaciones/expo.go`), así
 * que el token que espera es el de Expo y no el nativo de APNs o FCM.
 */

export type EstadoDelPermiso = 'sin-preguntar' | 'concedido' | 'denegado';

/**
 * Cómo se muestra un aviso que llega con la app abierta.
 *
 * Sin esto, iOS no dibuja nada mientras la app está en primer plano: el
 * recordatorio de un turno llegaría en silencio justo cuando el tutor está
 * mirando la pantalla. Se muestra la alerta y no se toca el badge, que no lo
 * usa nadie en esta app.
 */
export function configurarPresentacionDeAvisos(): void {
  if (!HAY_PUSH) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Si esta plataforma puede recibir avisos.
 *
 * En web no: el push del navegador es otro mecanismo (Web Push, con su propio
 * service worker y su propia suscripción), y el backend solo habla Expo. El
 * tutor que entra por web ve la pantalla de avisos explicándoselo, no un botón
 * que no hace nada (Alcance de Plataformas, 5.5).
 *
 * En un emulador tampoco: no hay aparato al que entregar.
 */
export const HAY_PUSH = !esWeb && Device.isDevice;

function traducir(
  estado: Notifications.PermissionStatus,
  puedeVolverAPedir: boolean,
): EstadoDelPermiso {
  if (estado === 'granted') return 'concedido';
  // Denegado no es "todavía no": el sistema operativo no vuelve a preguntar y
  // el único camino son los ajustes del teléfono.
  return puedeVolverAPedir ? 'sin-preguntar' : 'denegado';
}

export async function leerEstadoDelPermiso(): Promise<EstadoDelPermiso> {
  if (!HAY_PUSH) return 'denegado';
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return traducir(status, canAskAgain);
}

/** Dispara el prompt del sistema. Solo tiene efecto la primera vez. */
export async function pedirPermiso(): Promise<EstadoDelPermiso> {
  if (!HAY_PUSH) return 'denegado';
  const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
  return traducir(status, canAskAgain);
}

export function plataformaDelDispositivo(): PlataformaDeDispositivo {
  return Platform.OS === 'ios' ? PLATAFORMA_DE_DISPOSITIVO.IOS : PLATAFORMA_DE_DISPOSITIVO.ANDROID;
}

/**
 * Token de Expo de esta instalación, o `null` si no se puede obtener.
 *
 * Necesita el `projectId` de EAS, que sale de la configuración de la app. Sin
 * él, Expo no sabe a qué proyecto pertenece la instalación y no emite token:
 * devolver `null` deja la sesión funcionando sin avisos en vez de romper el
 * login por algo que no es del login.
 */
export async function obtenerTokenDePush(): Promise<string | null> {
  if (!HAY_PUSH) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
  if (!projectId) return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}
