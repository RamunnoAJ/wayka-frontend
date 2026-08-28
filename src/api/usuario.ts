import type { TipoUsuario } from '../constants/roles';
import { http } from '../lib/http';
import type { Usuario } from '../types/sesion';

/**
 * Cuentas de acceso. El tipo `Usuario` vive en `types/sesion.ts` porque es lo
 * que devuelve el login, y no se duplica acá.
 */

export interface FiltrosDeUsuarios {
  tipo_usuario?: TipoUsuario;
  activo?: boolean;
}

/**
 * Cuentas de la clínica del usuario autenticado. Es del clínica_admin: el
 * alcance lo decide el rol del token, nunca un parámetro.
 *
 * Es la única forma de llegar del plantel a la cuenta: `Veterinario` no expone
 * `usuario_id` —la referencia va al revés, `Usuario.veterinario_id`—, así que
 * para restablecerle la contraseña a alguien del plantel hay que cruzar los dos
 * listados por ese campo.
 */
export function listarUsuarios(filtros: FiltrosDeUsuarios = {}): Promise<Usuario[]> {
  return http.get<Usuario[]>('/usuarios', { params: { ...filtros } });
}

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
