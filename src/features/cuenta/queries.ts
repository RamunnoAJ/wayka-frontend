import { useMutation } from '@tanstack/react-query';

import { cambiarContrasena, type CambiarContrasenaEntrada } from '../../api/usuario';

/**
 * Cambio de contraseña.
 *
 * **No invalida ni toca la sesión**: el backend responde 204 y no rota los
 * tokens, así que la sesión en curso sigue valiendo con la contraseña nueva ya
 * puesta. Tampoco hay una query de cuenta que refrescar — lo único que cambió es
 * un hash que la API nunca devuelve.
 */
export function useCambiarContrasena(usuarioId: string) {
  return useMutation({
    mutationFn: (entrada: CambiarContrasenaEntrada) => cambiarContrasena(usuarioId, entrada),
  });
}
