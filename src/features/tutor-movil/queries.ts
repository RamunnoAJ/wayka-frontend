import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listarPacientes, type Paciente } from '../../api/paciente';
import { useSesion } from '../../hooks/useSesion';

/**
 * Datos del tutor en la app.
 *
 * El listado de pacientes es el mismo endpoint que usa el veterinario: cuál de
 * los dos alcances aplica lo decide el rol del token, nunca un parámetro
 * (Reglas de Negocio, 3.2). Acá devuelve sus mascotas, estén atendidas donde
 * estén.
 */
export function useMisMascotas(): UseQueryResult<Paciente[]> {
  return useQuery({
    queryKey: ['pacientes', 'mios'],
    queryFn: () => listarPacientes({ limite: 100 }),
  });
}

export function useMiTutorID(): string | undefined {
  const { sesion } = useSesion();
  return sesion?.usuario.tutor_id ?? undefined;
}
