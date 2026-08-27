import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { listarCitasDelAlcance, type CitaConPaciente, type FiltrosDeAgenda } from '../../api/cita';

export const CLAVES = {
  agenda: (filtros: FiltrosDeAgenda) => ['citas', 'alcance', filtros] as const,
};

export function useAgenda(filtros: FiltrosDeAgenda): UseQueryResult<CitaConPaciente[]> {
  return useQuery({
    queryKey: CLAVES.agenda(filtros),
    queryFn: () => listarCitasDelAlcance(filtros),
  });
}
