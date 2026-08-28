import { useMutation, useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  cambiarContrasena,
  listarUsuarios,
  type CambiarContrasenaEntrada,
  type FiltrosDeUsuarios,
} from '../../api/usuario';
import type { Usuario } from '../../types/sesion';

export const CLAVES_DE_CUENTA = {
  usuarios: (filtros: FiltrosDeUsuarios) => ['usuarios', filtros] as const,
};

/**
 * Cuentas de la clínica. Solo la alcanza el clínica_admin — para cualquier otro
 * rol el backend responde 403, así que no se pide.
 */
export function useUsuariosDeLaClinica(
  filtros: FiltrosDeUsuarios,
  habilitada: boolean,
): UseQueryResult<Usuario[]> {
  return useQuery({
    queryKey: CLAVES_DE_CUENTA.usuarios(filtros),
    queryFn: () => listarUsuarios(filtros),
    enabled: habilitada,
    staleTime: 5 * 60 * 1000,
  });
}

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
