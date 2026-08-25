import { useSesionStore } from '../stores/sesion';
import type { Sesion } from '../types/sesion';

interface EstadoSesionHook {
  sesion: Sesion | null;
  /** true mientras todavía no se intentó restaurar la sesión al arrancar. */
  cargando: boolean;
  autenticado: boolean;
}

/**
 * Lectura de la sesión en curso. Los guards de `/app` la consumen desde acá,
 * nunca leyendo el store directamente.
 */
export function useSesion(): EstadoSesionHook {
  const estado = useSesionStore();
  return {
    sesion: estado ?? null,
    cargando: estado === undefined,
    autenticado: Boolean(estado),
  };
}
