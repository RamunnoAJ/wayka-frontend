import { http } from '../lib/http';

/**
 * Dispositivos a los que la cuenta autenticada recibe avisos push.
 *
 * El token identifica **al teléfono, no a la persona**: si ya estaba registrado
 * por otra cuenta se lo reasigna a la que lo registra ahora, porque en ese
 * aparato entró otro usuario y seguir mandándole los avisos del anterior sería
 * filtrarle datos ajenos.
 */

export const PLATAFORMA_DE_DISPOSITIVO = {
  IOS: 'ios',
  ANDROID: 'android',
} as const;

export type PlataformaDeDispositivo =
  (typeof PLATAFORMA_DE_DISPOSITIVO)[keyof typeof PLATAFORMA_DE_DISPOSITIVO];

export interface Dispositivo {
  id: string;
  usuario_id: string;
  plataforma: PlataformaDeDispositivo;
  created_at: string;
  updated_at: string;
}

export interface RegistrarDispositivoEntrada {
  /** Token que el proveedor de push asigna a la instalación de la app. */
  token_push: string;
  plataforma: PlataformaDeDispositivo;
}

/**
 * Registra el teléfono. Es idempotente para el mismo token y la misma cuenta.
 *
 * El `token_push` **no vuelve en la respuesta**: es una credencial de entrega y
 * el cliente ya lo tiene.
 */
export function registrarDispositivo(entrada: RegistrarDispositivoEntrada): Promise<Dispositivo> {
  return http.post<Dispositivo>('/dispositivos', { body: entrada });
}

/** Baja del teléfono, al cerrar sesión. Cada cuenta alcanza solo los suyos. */
export function eliminarDispositivo(dispositivoId: string): Promise<null> {
  return http.delete<null>(`/dispositivos/${dispositivoId}`);
}
