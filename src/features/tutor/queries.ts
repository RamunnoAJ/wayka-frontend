import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  actualizarTutor,
  crearTutor,
  darDeBajaTutor,
  listarTutores,
  obtenerTutor,
  type ActualizarTutorEntrada,
  type CrearTutorEntrada,
  type FiltrosDeTutores,
  type Tutor,
} from '../../api/tutor';

export const CLAVES = {
  busqueda: (filtros: FiltrosDeTutores) => ['tutores', filtros] as const,
  tutor: (id: string) => ['tutor', id] as const,
};

/**
 * La búsqueda **no está acotada por clínica**: es como el veterinario resuelve
 * si el tutor ya existe antes de que haya ningún vínculo (Reglas de Negocio,
 * 3.2). Leer una ficha concreta sí exige vínculo, así que un resultado de la
 * búsqueda puede no ser abrible — el 403 lo decide el backend.
 */
export function useBuscarTutores(filtros: FiltrosDeTutores): UseQueryResult<Tutor[]> {
  return useQuery({
    queryKey: CLAVES.busqueda(filtros),
    queryFn: () => listarTutores(filtros),
    // Sin término de búsqueda el listado global no aporta: son todas las fichas
    // del sistema, sin orden útil para quien busca a una persona.
    enabled: Boolean(filtros.busqueda?.trim() || filtros.numero_documento?.trim()),
  });
}

export function useTutor(tutorId: string | undefined): UseQueryResult<Tutor> {
  return useQuery({
    queryKey: CLAVES.tutor(tutorId ?? ''),
    queryFn: () => obtenerTutor(tutorId as string),
    enabled: Boolean(tutorId),
  });
}

export function useCrearTutor() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearTutorEntrada) => crearTutor(entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['tutores'] });
    },
  });
}

export function useActualizarTutor(tutorId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (cambios: ActualizarTutorEntrada) => actualizarTutor(tutorId, cambios),
    onSuccess: (tutor) => {
      cliente.setQueryData(CLAVES.tutor(tutorId), tutor);
      cliente.invalidateQueries({ queryKey: ['tutores'] });
    },
  });
}

export function useDarDeBajaTutor() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (tutorId: string) => darDeBajaTutor(tutorId),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['tutores'] });
    },
  });
}
