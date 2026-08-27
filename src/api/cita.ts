import { http } from '../lib/http';

/**
 * Calendario del paciente.
 *
 * `estado` **no se escribe desde el cliente** en ninguna operación: nace en
 * `pendiente`, pasa a `cumplido` cuando se carga el Evento clínico que la
 * referencia por `cita_id`, y a `vencido` por un job del backend (Modelo de
 * Datos, 4.7). No hay endpoint que lo reciba — por eso no está en las entradas.
 */

export const TIPO_DE_CITA = {
  VACUNA: 'vacuna',
  CONTROL: 'control',
  CIRUGIA: 'cirugia',
} as const;

export type TipoDeCita = (typeof TIPO_DE_CITA)[keyof typeof TIPO_DE_CITA];

export const ESTADO_DE_CITA = {
  PENDIENTE: 'pendiente',
  CUMPLIDO: 'cumplido',
  VENCIDO: 'vencido',
} as const;

export type EstadoDeCita = (typeof ESTADO_DE_CITA)[keyof typeof ESTADO_DE_CITA];

export interface Cita {
  id: string;
  paciente_id: string;
  tipo: TipoDeCita;
  /**
   * Momento de la cita, ISO 8601 con hora y zona. Cae dentro del horario de
   * atención de la clínica del paciente y sobre su grilla de turnos (regla 2.2).
   */
  fecha_programada: string;
  /**
   * Profesional que va a atender, o null si la cita es de la clínica y todavía
   * no se repartió. Es **asignación y no autoría**: se cambia mientras la cita
   * siga pendiente, y no acota quién la alcanza — eso lo resuelve la mascota.
   */
  veterinario_id?: string | null;
  estado: EstadoDeCita;
  notificar_tutor: boolean;
  created_at: string;
  updated_at: string;
}

export interface FiltrosDeCitas {
  estado?: EstadoDeCita;
  limite?: number;
  desplazamiento?: number;
}

export interface FiltrosDeAgenda extends FiltrosDeCitas {
  /** ISO 8601. Acota a las citas cuyo momento es igual o posterior. */
  desde?: string;
  /** ISO 8601. Acota a las citas cuyo momento es anterior. */
  hasta?: string;
  /** Id de un profesional, o `SIN_ASIGNAR` para lo que falta repartir. */
  veterinario_id?: string;
}

/**
 * Valor literal con el que la agenda pide lo que todavía no se repartió. Es una
 * palabra y no un uuid reservado porque un uuid mágico sería un valor válido que
 * significa otra cosa.
 */
export const SIN_ASIGNAR = 'sin_asignar';

/**
 * Una cita del listado de alcance, con lo mínimo de la mascota para mostrarla.
 * No trae la ficha entera: una agenda necesita el nombre, no el historial.
 */
export interface CitaConPaciente {
  cita: Cita;
  paciente_nombre: string;
  paciente_especie?: string;
  /** Viene en la misma consulta para que la agenda no pida uno por fila. */
  veterinario_nombre?: string | null;
}

export interface CrearCitaEntrada {
  tipo: TipoDeCita;
  /**
   * ISO 8601 con hora. No puede ser pasado: la comparación es contra el instante
   * y no contra el día, así que hoy a las 09:00 a las 15:00 de hoy se rechaza.
   */
  fecha_programada: string;
  notificar_tutor?: boolean;
  /** Omitirlo deja la cita de la clínica, para repartirla después. */
  veterinario_id?: string;
}

export interface ActualizarCitaEntrada {
  tipo?: TipoDeCita;
  fecha_programada?: string;
  notificar_tutor?: boolean;
  /**
   * Asigna o reasigna. **Cadena vacía saca la asignación** y deja la cita de la
   * clínica otra vez — mismo criterio que `identificador_externo` en Paciente:
   * el contrato usa el valor vacío porque un campo ausente y uno en null no se
   * distinguen una vez deserializados.
   */
  veterinario_id?: string;
}

function rutaDePaciente(pacienteId: string): string {
  return `/pacientes/${pacienteId}/citas`;
}

export function listarCitas(pacienteId: string, filtros: FiltrosDeCitas = {}): Promise<Cita[]> {
  return http.get<Cita[]>(rutaDePaciente(pacienteId), { params: { ...filtros } });
}

/**
 * Las citas que alcanza el usuario autenticado: el veterinario, las de toda su
 * clínica; el tutor, las de sus mascotas. Cuál de los dos aplica lo decide el rol
 * del token, nunca un parámetro (Reglas de Negocio, 3.2).
 *
 * Existe además del calendario de una mascota porque responde otra pregunta: qué
 * tiene la clínica esta semana no cuelga de ninguna mascota en particular.
 */
export function listarCitasDelAlcance(filtros: FiltrosDeAgenda = {}): Promise<CitaConPaciente[]> {
  return http.get<CitaConPaciente[]>('/citas', { params: { ...filtros } });
}

export function crearCita(pacienteId: string, entrada: CrearCitaEntrada): Promise<Cita> {
  return http.post<Cita>(rutaDePaciente(pacienteId), { body: entrada });
}

/**
 * Reagenda. Solo aplica a las **pendientes**: una cita cumplida o vencida no
 * cambia de fecha ni de tipo (regla 2.2). Lo que se hace con una vencida es
 * agendar una nueva.
 */
export function actualizarCita(citaId: string, entrada: ActualizarCitaEntrada): Promise<Cita> {
  return http.patch<Cita>(`/citas/${citaId}`, { body: entrada });
}

export function darDeBajaCita(citaId: string): Promise<null> {
  return http.delete<null>(`/citas/${citaId}`);
}

export function esReagendable(cita: Cita): boolean {
  return cita.estado === ESTADO_DE_CITA.PENDIENTE;
}
