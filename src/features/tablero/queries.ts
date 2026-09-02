import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { obtenerTablero, type PeriodoDelTablero, type Tablero } from '../../api/tablero';

export const CLAVES = {
  tablero: (clinicaId: string, periodo: PeriodoDelTablero) =>
    ['tablero', clinicaId, periodo] as const,
};

/**
 * Los tres bloques vienen juntos en una sola consulta, con un único período: es
 * la misma razón por la que el backend los devuelve juntos y no en tres
 * endpoints.
 */
export function useTablero(
  clinicaId: string | undefined,
  periodo: PeriodoDelTablero,
): UseQueryResult<Tablero> {
  return useQuery({
    queryKey: CLAVES.tablero(clinicaId ?? '', periodo),
    queryFn: () => obtenerTablero(clinicaId as string, periodo),
    enabled: Boolean(clinicaId),
    // Son conteos de gestión, no una pantalla de tiempo real: un minuto de
    // frescura alcanza y evita un viaje por cada vuelta al panel.
    staleTime: 60 * 1000,
  });
}
