import { Platform } from 'react-native';

import { CANAL, type Canal } from '../constants/roles';

/** true en la exportación web, false en los builds nativos (iOS/Android). */
export const esWeb = Platform.OS === 'web';
export const esNativo = !esWeb;

/**
 * Canal que el cliente declara al backend en el login (Arquitectura, 4.4).
 * Es fijo por plataforma en el código — nunca una opción del usuario.
 */
export const CANAL_ACTUAL: Canal = esWeb ? CANAL.WEB : CANAL.MOVIL;
