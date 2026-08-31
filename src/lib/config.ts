import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * URL base de la API.
 *
 * `EXPO_PUBLIC_API_URL` gana siempre y es lo que se usa en cualquier build que
 * no sea de desarrollo. Es una variable pública de Expo: se inlinea en el
 * bundle, así que no puede contener secretos.
 *
 * Sin esa variable, en desarrollo se deduce el host del propio servidor de
 * Metro. Es lo que evita el error más común de arrancar en un dispositivo:
 * `localhost` no significa lo mismo en cada lado. En el navegador es la
 * máquina de desarrollo, pero en un emulador de Android o en un teléfono real
 * es *el dispositivo*, así que apuntar ahí no llega a ningún backend.
 */

/** Puerto del backend en desarrollo. */
const PUERTO_API_DEV = 8080;

/** Alias del emulador de Android hacia la loopback de la máquina anfitriona. */
const LOOPBACK_ANFITRION_ANDROID = '10.0.2.2';

const LOCALES = ['localhost', '127.0.0.1', '::1'];

/**
 * Host desde el que se está sirviendo el bundle (`192.168.1.40:8081`), que es
 * por definición una dirección a la que el dispositivo puede llegar.
 */
function hostDeMetro(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ?? (Constants.expoGoConfig?.debuggerHost as string | undefined);
  if (!hostUri) return null;
  const host = hostUri.split('/')[0]?.split(':')[0];
  return host || null;
}

function urlDeDesarrollo(): string {
  let host = hostDeMetro() ?? 'localhost';

  // Metro servido en localhost + emulador de Android: el emulador llega a la
  // máquina anfitriona solo por su alias, no por su propia loopback.
  if (Platform.OS === 'android' && LOCALES.includes(host)) {
    host = LOOPBACK_ANFITRION_ANDROID;
  }

  return `http://${host}:${PUERTO_API_DEV}`;
}

const desdeEntorno = process.env.EXPO_PUBLIC_API_URL;

export const API_URL = desdeEntorno ?? urlDeDesarrollo();

/** Prefijo versionado de la API: todas las rutas del contrato cuelgan de acá. */
export const API_PREFIJO = '/api/v1';

/**
 * Proveedor de mapas para el autocompletado de direcciones y la confirmación
 * del punto (Arquitectura, 3.6).
 *
 * El proveedor nulo es el default a propósito: sin la variable, el campo de
 * dirección es texto libre y el proyecto levanta igual. Nadie tiene que dar de
 * alta una clave facturable solo para clonar el repo y arrancar, y un
 * despliegue mal configurado degrada a texto libre en vez de romper el
 * formulario.
 *
 * La clave se inlinea en el bundle y eso está bien: una clave de cliente es
 * pública por definición y lo que la protege son las restricciones de la
 * consola de Google (por dominio, por bundle id, y limitada a las APIs que
 * usamos), no esconderla.
 */
export const MAPAS_API_KEY = process.env.EXPO_PUBLIC_MAPAS_API_KEY ?? '';

export const HAY_MAPAS =
  process.env.EXPO_PUBLIC_MAPAS_PROVEEDOR === 'google' && MAPAS_API_KEY !== '';

/**
 * Sesga el autocompletado a Argentina, que es el alcance del MVP. No lo
 * restringe: una dirección de otro país se puede escribir a mano igual, porque
 * confirmar en el mapa nunca es obligatorio.
 */
export const MAPAS_REGION = 'ar';
