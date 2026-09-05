import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  crearPropuesta,
  listarPropuestas,
  quitarVotoDePropuesta,
  votarPropuesta,
  type CrearPropuestaEntrada,
  type OrdenDePropuestas,
  type Propuesta,
} from '../../api/propuesta';

/**
 * El tablero se pide entero y se pagina en el cliente, como el historial
 * clínico: el techo de 200 es más alto que cualquier tablero que este piloto vaya
 * a tener, y así cambiar de orden no cuesta un viaje.
 */
const LIMITE = 200;

export const CLAVES = {
  todas: () => ['propuestas'] as const,
  // El orden cuelga de la clave del tablero: una invalidación sobre `todas()`
  // alcanza a los dos órdenes, que son la misma lista vista de otra manera.
  lista: (orden: OrdenDePropuestas) => ['propuestas', { orden }] as const,
};

export function usePropuestas(orden: OrdenDePropuestas): UseQueryResult<Propuesta[]> {
  return useQuery({
    queryKey: CLAVES.lista(orden),
    queryFn: () => listarPropuestas({ orden, limite: LIMITE }),
    // Un tablero de ideas no es una pantalla de tiempo real: dos minutos de
    // frescura alcanzan y evitan un viaje por cada vuelta desde Ajustes.
    staleTime: 2 * 60 * 1000,
  });
}

export function useCrearPropuesta() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearPropuestaEntrada) => crearPropuesta(entrada),
    // Una propuesta nueva sí cambia la lista y su orden, así que acá sí se
    // invalida: el usuario acaba de pedir explícitamente que aparezca.
    onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVES.todas() }),
  });
}

/**
 * Poner y sacar el voto son dos operaciones del backend; alternar es de acá,
 * que sabe si el botón está encendido.
 *
 * **No es optimista**: el repo invalida en `onSuccess` y reserva el optimismo
 * para la cola offline, que es el único lugar sin respuesta que esperar. Pero
 * tampoco invalida la lista — invalidar la volvería a pedir ordenada por votos y
 * la tarjeta recién tocada se movería debajo del dedo. Se escribe la fila que
 * devolvió el backend, y el orden se recalcula al volver a entrar.
 */
export function useAlternarVoto(orden: OrdenDePropuestas) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ id, votada }: { id: string; votada: boolean }) =>
      votada ? quitarVotoDePropuesta(id) : votarPropuesta(id),
    onSuccess: (propuesta) => {
      cliente.setQueryData<Propuesta[]>(CLAVES.lista(orden), (previas) =>
        previas?.map((p) => (p.id === propuesta.id ? propuesta : p)),
      );
    },
  });
}
