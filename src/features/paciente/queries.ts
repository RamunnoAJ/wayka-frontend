import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  listarAdjuntos,
  partirPorPertenencia,
  retirarAdjunto,
  type Adjunto,
} from '../../api/adjunto';
import { listarCitas, type Cita } from '../../api/cita';
import {
  camposDeAlergia,
  camposDeVacuna,
  listarEventosClinicos,
  TIPO_DE_EVENTO,
  type EventoClinico,
} from '../../api/evento-clinico';
import {
  cerrarMedicacion,
  crearMedicacion,
  listarMedicaciones,
  partirPorVigencia,
  type CrearMedicacionEntrada,
  type Medicacion,
} from '../../api/medicacion';
import { darDeBajaPaciente, obtenerPaciente, type Paciente } from '../../api/paciente';
import { obtenerTutor, type Tutor } from '../../api/tutor';
import {
  indexarPorId,
  listarVeterinarios,
  obtenerVeterinario,
  puedeEscribirClinico,
  type Veterinario,
} from '../../api/veterinario';
import { useSesion } from '../../hooks/useSesion';
import { aIso } from './formato';

/**
 * Datos de la ficha de paciente.
 *
 * Son seis recursos distintos y cada uno falla por su cuenta a propósito: el
 * diseño pide que un error de red viva **dentro del bloque que falló** y que el
 * resto de la pantalla siga usable. Una sola query combinada haría que la caída
 * del historial se llevara puesta la identidad del paciente.
 */
export const CLAVES = {
  paciente: (id: string) => ['paciente', id] as const,
  tutor: (id: string) => ['tutor', id] as const,
  eventos: (id: string) => ['paciente', id, 'eventos-clinicos'] as const,
  medicaciones: (id: string) => ['paciente', id, 'medicaciones'] as const,
  citas: (id: string) => ['paciente', id, 'citas'] as const,
  adjuntos: (id: string) => ['paciente', id, 'adjuntos'] as const,
  plantel: () => ['veterinarios'] as const,
  veterinario: (id: string) => ['veterinario', id] as const,
};

export function usePaciente(pacienteId: string): UseQueryResult<Paciente> {
  return useQuery({
    queryKey: CLAVES.paciente(pacienteId),
    queryFn: () => obtenerPaciente(pacienteId),
  });
}

export function useTutor(tutorId: string | undefined): UseQueryResult<Tutor> {
  return useQuery({
    queryKey: CLAVES.tutor(tutorId ?? ''),
    queryFn: () => obtenerTutor(tutorId as string),
    enabled: Boolean(tutorId),
  });
}

export function useEventosClinicos(pacienteId: string): UseQueryResult<EventoClinico[]> {
  return useQuery({
    queryKey: CLAVES.eventos(pacienteId),
    queryFn: () => listarEventosClinicos(pacienteId, { limite: 200 }),
  });
}

export function useMedicaciones(pacienteId: string): UseQueryResult<Medicacion[]> {
  return useQuery({
    queryKey: CLAVES.medicaciones(pacienteId),
    queryFn: () => listarMedicaciones(pacienteId, { limite: 200 }),
  });
}

export function useCitas(pacienteId: string): UseQueryResult<Cita[]> {
  return useQuery({
    queryKey: CLAVES.citas(pacienteId),
    queryFn: () => listarCitas(pacienteId, { limite: 200 }),
  });
}

/**
 * Un solo pedido de adjuntos para toda la ficha: el listado trae los generales y
 * los de cada evento juntos, y se parten en el cliente. Pedirlos por evento
 * dispararía un request por fila del timeline.
 */
export function useAdjuntos(pacienteId: string): UseQueryResult<Adjunto[]> {
  return useQuery({
    queryKey: CLAVES.adjuntos(pacienteId),
    queryFn: () => listarAdjuntos(pacienteId, { limite: 200 }),
  });
}

/**
 * Plantel de la clínica, para resolver el nombre del autor de cada registro:
 * los Eventos clínicos y las Medicaciones traen `veterinario_id` y nada más.
 */
export function usePlantel(): UseQueryResult<Map<string, Veterinario>> {
  return useQuery({
    queryKey: CLAVES.plantel(),
    queryFn: async () => indexarPorId(await listarVeterinarios()),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Ficha del veterinario autenticado, solo para saber si tiene matrícula: sin
 * ella la ficha queda en lectura para lo clínico (regla 2.1). El backend
 * rechaza igual — esto es para no ofrecer botones que van a fallar.
 */
export function useMiFichaDeVeterinario(): UseQueryResult<Veterinario> {
  const { sesion } = useSesion();
  const veterinarioId = sesion?.usuario.veterinario_id ?? undefined;
  return useQuery({
    queryKey: CLAVES.veterinario(veterinarioId ?? ''),
    queryFn: () => obtenerVeterinario(veterinarioId as string),
    enabled: Boolean(veterinarioId),
    staleTime: 5 * 60 * 1000,
  });
}

export interface DatosCriticos {
  /** Eventos vigentes de tipo alergia (Modelo de Datos, 4.5, última nota). */
  alergias: EventoClinico[];
  haySevera: boolean;
  activas: Medicacion[];
  historicas: Medicacion[];
  ultimaVacuna: EventoClinico | null;
  proximaDosis: string | null;
}

/**
 * La vista de urgencia del contrato: alergias vigentes + medicación activa +
 * vacunas. Se arma en el cliente porque el backend no expone un endpoint que la
 * devuelva junta.
 */
export function derivarDatosCriticos(
  eventos: EventoClinico[] | undefined,
  medicaciones: Medicacion[] | undefined,
): DatosCriticos {
  const lista = eventos ?? [];
  const alergias = lista.filter((e) => e.tipo === TIPO_DE_EVENTO.ALERGIA);
  const vacunas = lista.filter((e) => e.tipo === TIPO_DE_EVENTO.VACUNA);
  const { activas, historicas } = partirPorVigencia(medicaciones ?? []);

  // El listado ya viene de lo más reciente hacia atrás, pero no se asume: una
  // vacuna vieja mostrada como "última aplicada" es un error clínico.
  const ordenadas = [...vacunas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ultimaVacuna = ordenadas[0] ?? null;

  const proximas = vacunas
    .map((v) => camposDeVacuna(v)?.fecha_proxima_dosis)
    .filter((f): f is string => Boolean(f))
    .sort();
  const hoy = aIso(new Date());
  const proximaDosis = proximas.find((f) => f >= hoy) ?? null;

  return {
    alergias,
    haySevera: alergias.some((a) => camposDeAlergia(a)?.severidad === 'severa'),
    activas,
    historicas,
    ultimaVacuna,
    proximaDosis,
  };
}

/** Adjuntos partidos como los consume la pantalla. */
export function derivarAdjuntos(adjuntos: Adjunto[] | undefined) {
  return partirPorPertenencia(adjuntos ?? []);
}

export function useCerrarMedicacion(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (medicacionId: string) => cerrarMedicacion(medicacionId, aIso(new Date())),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.medicaciones(pacienteId) });
    },
  });
}

export function useCrearMedicacion(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CrearMedicacionEntrada) => crearMedicacion(pacienteId, entrada),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.medicaciones(pacienteId) });
    },
  });
}

export function useRetirarAdjunto(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (adjuntoId: string) => retirarAdjunto(adjuntoId),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.adjuntos(pacienteId) });
    },
  });
}

export function useDarDeBajaPaciente(pacienteId: string) {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: () => darDeBajaPaciente(pacienteId),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVES.paciente(pacienteId) });
    },
  });
}

export { puedeEscribirClinico };
