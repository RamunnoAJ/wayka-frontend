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

/**
 * El efecto que tendría cargar esa ausencia. No escribe nada —manda un cuerpo
 * por el tamaño del rango, no porque mute algo—, así que es una consulta y no
 * una mutación: el contrato pide que la pantalla **diga** el efecto antes de
 * guardar (Reglas 4.22 paso 2), no que lo ofrezca detrás de un botón.
 *
 * Con `entrada` en null la consulta queda apagada, que es lo que pasa mientras
 * el rango no cierra o mientras se está tecleando la fecha.
 */
export function usePrevisualizacionDeAusencia(
  entrada: CrearAusenciaEntrada | null,
): UseQueryResult<PrevisualizacionDeAusencia> {
  return useQuery({
    queryKey: ['ausencias', 'previsualizacion', entrada] as const,
    queryFn: () => previsualizarAusencia(entrada as CrearAusenciaEntrada),
    enabled: entrada !== null,
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
