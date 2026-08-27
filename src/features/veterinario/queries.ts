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

export function usePlantel(): UseQueryResult<Veterinario[]> {
  return useQuery({ queryKey: CLAVES.plantel(), queryFn: listarVeterinarios });
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
