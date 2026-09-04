import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  actualizarVeterinario,
  crearVeterinario,
  darDeBajaVeterinario,
  listarVeterinarios,
  reenviarActivacionDeVeterinario,
  type ActualizarVeterinarioEntrada,
  type CrearVeterinarioEntrada,
  type Veterinario,
} from '../../api/veterinario';

export const CLAVES = {
  plantel: () => ['veterinarios'] as const,
  // La búsqueda cuelga de la clave del plantel, no al lado: así una invalidación
  // sobre `plantel()` alcanza también a los resultados filtrados, que son del
  // mismo listado visto por una rendija.
  busqueda: (busqueda: string) => ['veterinarios', { busqueda }] as const,
};

/**
 * Consulta del plantel, compartida por las dos formas en que se lo mira: como
 * lista (acá) y como índice por cuenta (`usePlantelPorAutor` en `../paciente`).
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
  // Envuelta y no pasada por referencia: react-query le pasa su contexto al
  // queryFn, y `listarVeterinarios` ahora recibe filtros.
  queryFn: () => listarVeterinarios(),
  // El plantel de una clínica cambia cada varios meses. Volver a pedirlo en
  // cada pantalla que resuelve el autor de un registro es tráfico puro.
  staleTime: 5 * 60 * 1000,
} as const;

/**
 * Sin búsqueda es la consulta compartida —la misma que alimenta el índice por
 * id—, y con búsqueda es una consulta aparte. No se filtra en el cliente porque
 * el buscador existe justamente para lo que la lista cargada no dice: si una
 * matrícula ya está en uso, que es única en todo el sistema y no solo en esta
 * clínica.
 */
export function usePlantel(busqueda = ''): UseQueryResult<Veterinario[]> {
  const filtro = busqueda.trim();
  // Sin filtro la clave y la queryFn son literalmente las de la consulta
  // compartida, así que la caché es una sola y no dos con la misma forma.
  const consulta =
    filtro === ''
      ? { queryKey: CONSULTA_DEL_PLANTEL.queryKey, queryFn: CONSULTA_DEL_PLANTEL.queryFn }
      : {
          queryKey: CLAVES.busqueda(filtro),
          queryFn: () => listarVeterinarios({ busqueda: filtro }),
        };

  return useQuery({
    queryKey: consulta.queryKey as readonly unknown[],
    queryFn: consulta.queryFn,
    staleTime: CONSULTA_DEL_PLANTEL.staleTime,
  });
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

/**
 * Vuelve a mandar el correo de activación de una cuenta que nadie estrenó. Es la
 * salida del token que se venció o del correo que no llegó; sin esto la única
 * sería que el administrador de la plataforma emita otro por línea de comandos.
 *
 * No invalida nada: el estado de la cuenta no cambia —sigue sin estrenar— y lo
 * único que ocurre está del otro lado, en la casilla de esa persona.
 */
export function useReenviarActivacion() {
  return useMutation({
    mutationFn: (veterinarioId: string) => reenviarActivacionDeVeterinario(veterinarioId),
  });
}
