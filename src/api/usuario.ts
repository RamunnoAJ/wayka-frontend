import { http } from '../lib/http';

/**
 * Cuentas de acceso. El tipo `Usuario` vive en `types/sesion.ts` porque es lo
 * que devuelve el login, y no se duplica acá.
 */

export interface CambiarContrasenaEntrada {
  /**
   * Obligatoria cuando alguien cambia **la suya y ya tenía una**. Se omite en
   * dos casos que el backend distingue: una cuenta creada con Google que
   * establece contraseña por primera vez, y un clínica_admin restableciendo la
   * de una cuenta de su clínica, que no la conoce.
   */
  contrasena_actual?: string;
  contrasena_nueva: string;
}

/** Responde 204: no devuelve la cuenta ni una sesión nueva. */
export function cambiarContrasena(
  usuarioId: string,
  entrada: CambiarContrasenaEntrada,
): Promise<null> {
  return http.put<null>(`/usuarios/${usuarioId}/contrasena`, { body: entrada });
}
