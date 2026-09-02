import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  actualizarCita,
  crearCita,
  listarCitasDelAlcance,
  type CitaConPaciente,
  type CrearCitaEntrada,
  type ActualizarCitaEntrada,
  type FiltrosDeAgenda,
} from '../../api/cita';
import {
  crearPaciente,
  listarCartera,
  type CrearPacienteEntrada,
  type PacienteEnLaCartera,
} from '../../api/paciente';
import {
  crearTutor,
  listarPadron,
  type CrearTutorEntrada,
  type TutorEnElPadron,
} from '../../api/tutor';

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

/**
 * La cartera de la clínica, para poder nombrar la mascota al agendar. Es una
 * proyección: nombre, especie y a quién llamar, sin abrir ninguna ficha.
 *
 * `enabled` cuelga de que haya algo escrito: sin búsqueda la lista entera no le
 * sirve a nadie, y con una cartera grande sería un viaje por cada apertura.
 */
export function useCartera(busqueda: string): UseQueryResult<PacienteEnLaCartera[]> {
  return useQuery({
    queryKey: ['cartera', busqueda] as const,
    queryFn: () => listarCartera({ busqueda }),
    enabled: busqueda.trim().length > 0,
  });
}

/**
 * Agenda un turno desde la agenda de la clínica. La cita nace en la clínica del
 * actor: no se manda, la resuelve el backend.
 */
export function useAgendarDesdeLaAgenda() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ pacienteId, entrada }: { pacienteId: string; entrada: CrearCitaEntrada }) =>
      crearCita(pacienteId, entrada),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['citas'] });
      void cliente.invalidateQueries({ queryKey: ['tablero'] });
    },
  });
}

/**
 * El padrón: cómo el mostrador resuelve si la persona que llama ya está.
 *
 * No se acota por clínica —antes del alta no hay vínculo contra el cual acotar—,
 * y sale en proyección reducida: nombre, contacto y si la ficha ya tiene
 * documento. Igual que la cartera, `enabled` cuelga de que haya algo escrito.
 */
export function usePadron(busqueda: string): UseQueryResult<TutorEnElPadron[]> {
  return useQuery({
    queryKey: ['padron', busqueda] as const,
    queryFn: () => listarPadron({ busqueda }),
    enabled: busqueda.trim().length > 0,
  });
}

/**
 * Da de alta la ficha del tutor desde el mostrador, con lo único que el rol
 * escribe: nombre, contacto y consentimiento. Documento y dirección los completa
 * el veterinario cuando atiende.
 */
export function useCrearTutorDesdeElMostrador() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearTutorEntrada) => crearTutor(entrada),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['padron'] });
    },
  });
}

/**
 * Da de alta la mascota. El vínculo con la clínica lo crea el backend en la
 * misma operación, que es lo que la hace aparecer en la cartera: por eso se
 * invalida también, y no solo el tablero.
 */
export function useDarDeAltaDesdeElMostrador() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearPacienteEntrada) => crearPaciente(entrada),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['cartera'] });
      void cliente.invalidateQueries({ queryKey: ['tablero'] });
    },
  });
}

/** Reagenda: mueve la hora, y de paso puede cambiar el aviso al tutor. */
export function useReagendarDesdeLaAgenda() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ citaId, cambios }: { citaId: string; cambios: ActualizarCitaEntrada }) =>
      actualizarCita(citaId, cambios),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['citas'] });
    },
  });
}
