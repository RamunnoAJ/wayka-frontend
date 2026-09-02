import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  actualizarCita,
  listarCitasDelAlcance,
  type CitaConPaciente,
  type FiltrosDeAgenda,
} from '../../api/cita';

export const CLAVES = {
  agenda: (filtros: FiltrosDeAgenda) => ['citas', 'alcance', filtros] as const,
};

export function useAgenda(filtros: FiltrosDeAgenda): UseQueryResult<CitaConPaciente[]> {
  return useQuery({
    queryKey: CLAVES.agenda(filtros),
    queryFn: () => listarCitasDelAlcance(filtros),
  });
}

/**
 * Reparte una cita de la clínica: le pone profesional o se lo saca.
 *
 * La cadena vacía **saca** la asignación y deja la cita de la clínica otra vez:
 * el contrato usa el valor vacío porque un campo ausente y uno en null no se
 * distinguen una vez deserializados (`ActualizarCitaEntrada`).
 *
 * Invalida la agenda entera y no una fila: repartir cambia también el conteo de
 * "sin asignar", que es el filtro desde el que se suele estar mirando.
 */
export function useAsignarProfesional() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ citaId, veterinarioId }: { citaId: string; veterinarioId: string }) =>
      actualizarCita(citaId, { veterinario_id: veterinarioId }),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['citas'] });
      void cliente.invalidateQueries({ queryKey: ['tablero'] });
    },
  });
}
