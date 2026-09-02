import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  crearAusencia,
  darDeBajaAusencia,
  listarAusencias,
  previsualizarAusencia,
  type Ausencia,
  type AusenciaCreada,
  type CrearAusenciaEntrada,
  type FiltrosDeAusencias,
  type PrevisualizacionDeAusencia,
} from '../../api/ausencia';

export const CLAVES = {
  ausencias: (filtros: FiltrosDeAusencias) => ['ausencias', filtros] as const,
};

export function useAusencias(filtros: FiltrosDeAusencias = {}): UseQueryResult<Ausencia[]> {
  return useQuery({
    queryKey: CLAVES.ausencias(filtros),
    queryFn: () => listarAusencias(filtros),
  });
}

/**
 * Cargar una ausencia desasigna las citas que caen adentro del rango, así que
 * invalida también la agenda: lo que esté en pantalla quedó viejo.
 */
export function useCrearAusencia() {
  const cliente = useQueryClient();
  return useMutation<AusenciaCreada, Error, CrearAusenciaEntrada>({
    mutationFn: crearAusencia,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['ausencias'] });
      void cliente.invalidateQueries({ queryKey: ['citas'] });
      void cliente.invalidateQueries({ queryKey: ['tablero'] });
    },
  });
}

/** No escribe nada: se dispara a mano y manda un cuerpo, así que es mutación por su forma. */
export function usePrevisualizarAusencia() {
  return useMutation<PrevisualizacionDeAusencia, Error, CrearAusenciaEntrada>({
    mutationFn: previsualizarAusencia,
  });
}

/**
 * La baja no reasigna las citas: siguen sin profesional. Se invalida la agenda
 * igual porque el profesional vuelve a estar disponible para asignaciones nuevas.
 */
export function useDarDeBajaAusencia() {
  const cliente = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: darDeBajaAusencia,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['ausencias'] });
      void cliente.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
