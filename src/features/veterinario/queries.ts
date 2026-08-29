import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  actualizarVeterinario,
  crearVeterinario,
  darDeBajaVeterinario,
  listarVeterinarios,
  type ActualizarVeterinarioEntrada,
  type CrearVeterinarioEntrada,
  type Veterinario,
} from '../../api/veterinario';

export const CLAVES = {
  plantel: () => ['veterinarios'] as const,
};

/**
 * Consulta del plantel, compartida por las dos formas en que se lo mira: como
 * lista (acá) y como índice por id (`usePlantelPorId` en `../paciente`).
 *
 * Se exporta el objeto entero y no solo la clave porque lo que las dos tienen
 * que compartir es **cómo se trae y qué queda cacheado**, no únicamente dónde.
 * La caché guarda un valor por clave: dos consultas con la misma clave y
 * distinto `queryFn` se dejan una a la otra un valor con la forma equivocada, y
 * el que esperaba lo contrario llama un método que no existe. Con el objeto
 * compartido eso no se puede escribir por accidente.
 *
 * Lo único que cambia cada consumidor es su `select`, que transforma por
 * observador y no toca la caché.
 */
export const CONSULTA_DEL_PLANTEL = {
  queryKey: CLAVES.plantel(),
  queryFn: listarVeterinarios,
  // El plantel de una clínica cambia cada varios meses. Volver a pedirlo en
  // cada pantalla que resuelve el autor de un registro es tráfico puro.
  staleTime: 5 * 60 * 1000,
} as const;

export function usePlantel(): UseQueryResult<Veterinario[]> {
  return useQuery(CONSULTA_DEL_PLANTEL);
}

export function useCrearVeterinario() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearVeterinarioEntrada) => crearVeterinario(entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.plantel() });
    },
  });
}

export function useActualizarVeterinario() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: ActualizarVeterinarioEntrada }) =>
      actualizarVeterinario(id, cambios),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.plantel() });
    },
  });
}

/**
 * La baja marca la ficha y **desactiva su cuenta en la misma operación** (regla
 * 2.4): separarlas dejaría a un ex empleado con acceso. No cascadea sobre lo que
 * escribió — sus eventos y medicaciones conservan la autoría.
 */
export function useDarDeBajaVeterinario() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => darDeBajaVeterinario(id),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.plantel() });
    },
  });
}
