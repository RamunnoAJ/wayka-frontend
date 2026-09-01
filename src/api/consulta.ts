import { http } from '../lib/http';

/**
 * La atención asentada: que la clínica atendió a esta mascota, separado del
 * historial que se escriba sobre ella.
 *
 * La cadena es **Cita** (lo que se planeó) → **Consulta atendida** (lo que
 * ocurrió) → **Evento clínico** (lo que se escribió). Existe como entidad propia
 * porque la mayoría de las atenciones no estaban agendadas, y colgar el hecho de
 * la Cita dejaría afuera al caso más frecuente (Modelo de Datos, 4.16).
 *
 * **Solo la ve el veterinario.** Ni el tutor ni el clínica_admin la leen: al
 * primero le sirve el historial y no el asiento, y decirle al segundo qué mascota
 * fue atendida es justo lo que la matriz de permisos le niega.
 */

export const ORIGEN_DE_CONSULTA = {
  AGENDADA: 'agendada',
  ESPONTANEA: 'espontanea',
  URGENCIA: 'urgencia',
} as const;

export type OrigenDeConsulta = (typeof ORIGEN_DE_CONSULTA)[keyof typeof ORIGEN_DE_CONSULTA];

export interface ConsultaAtendida {
  id: string;
  paciente_id: string;
  /** Sale del actor y es fija, como en Cita. */
  clinica_id: string;
  /**
   * Quién atendió. No admite null, al revés que en Cita: una cita puede quedar de
   * la clínica y repartirse después, pero una atención sin profesional no es un
   * hecho asistencial.
   */
  veterinario_id: string;
  /** La cita que vino a cumplir; null cuando nadie la agendó. */
  cita_id?: string | null;
  origen: OrigenDeConsulta;
  /** ISO 8601 con hora. Se lee en la zona de la clínica, como la cita. */
  fecha_hora: string;
  /** Quién la asentó, que puede no ser quien atendió. */
  registrada_por_usuario_id: string;
  /**
   * True cuando la dedujo el sistema al cargarse un evento clínico que declara su
   * cita, y no un profesional al atender. Separa lo asentado de lo deducido: la
   * cobertura se lee sobre lo primero (Telemetría de Producto, 9).
   */
  asentada_automaticamente: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Una fila de la lista del día, con lo mínimo de la mascota para mostrarla sin un
 * pedido por fila.
 */
export interface ConsultaAtendidaConPaciente {
  consulta: ConsultaAtendida;
  paciente_nombre: string;
  paciente_especie?: string;
  veterinario_nombre?: string;
  /** En cero es una atención sin historial cargado: el trabajo pendiente del día. */
  eventos_clinicos_n: number;
  zona_horaria: string;
}

export interface AsentarConsultaEntrada {
  origen: OrigenDeConsulta;
  /**
   * Obligatoria con origen `agendada` y no admitida con los otros dos: sin cita no
   * hay nada que hubiera estado agendado.
   */
  cita_id?: string;
  /** Omitirlo asienta al veterinario autenticado, que es el caso normal. */
  veterinario_id?: string;
  /** ISO 8601. Omitirlo asienta el momento actual — asentar vale un toque. */
  fecha_hora?: string;
}

export interface ActualizarConsultaEntrada {
  origen?: OrigenDeConsulta;
  veterinario_id?: string;
  fecha_hora?: string;
}

export interface FiltrosDeConsultas {
  limite?: number;
  desplazamiento?: number;
}

export interface FiltrosDeConsultasDeLaClinica extends FiltrosDeConsultas {
  /** Solo las atenciones sin ningún evento clínico colgado. */
  sin_historial?: boolean;
  veterinario_id?: string;
  /** ISO 8601. */
  desde?: string;
  /** ISO 8601. */
  hasta?: string;
}

function rutaDePaciente(pacienteId: string): string {
  return `/pacientes/${pacienteId}/consultas`;
}

/**
 * Asienta la atención. Con `cita_id` la marca cumplida: cumplir una cita es haber
 * atendido, no haber escrito, así que esto y no la carga del evento es lo que la
 * cierra (Reglas de Negocio, 4.4).
 */
export function asentarConsulta(
  pacienteId: string,
  entrada: AsentarConsultaEntrada,
): Promise<ConsultaAtendida> {
  return http.post<ConsultaAtendida>(rutaDePaciente(pacienteId), { body: entrada });
}

export function listarConsultasDePaciente(
  pacienteId: string,
  filtros: FiltrosDeConsultas = {},
): Promise<ConsultaAtendida[]> {
  return http.get<ConsultaAtendida[]>(rutaDePaciente(pacienteId), { params: { ...filtros } });
}

/**
 * La lista de trabajo del día de la clínica. Con `sin_historial` devuelve lo que
 * se atendió y todavía no se documentó, que es lo único que hace que asentar
 * valga la pena para quien asienta y no solo para quien mira las métricas
 * (Alcance de Plataformas, 3.3.1).
 */
export function listarConsultasDeLaClinica(
  filtros: FiltrosDeConsultasDeLaClinica = {},
): Promise<ConsultaAtendidaConPaciente[]> {
  return http.get<ConsultaAtendidaConPaciente[]>('/consultas', { params: { ...filtros } });
}

/**
 * Corrige el asiento. El paciente, la clínica y la cita no son editables: mover un
 * hecho asistencial de turno no es corregirlo, es dar de baja este y hacer el que
 * corresponde.
 */
export function actualizarConsulta(
  consultaId: string,
  entrada: ActualizarConsultaEntrada,
): Promise<ConsultaAtendida> {
  return http.patch<ConsultaAtendida>(`/consultas/${consultaId}`, { body: entrada });
}

/**
 * Da de baja un asiento cargado por error. Si no había historial cargado, la cita
 * vuelve a estar por atender; si ya lo había, queda cumplida — lo que se atendió y
 * se documentó ocurrió, más allá de que el asiento estuviera mal.
 */
export function darDeBajaConsulta(consultaId: string): Promise<null> {
  return http.delete<null>(`/consultas/${consultaId}`);
}

/** Una atención asentada por una persona es la que cuenta para la cobertura. */
export function laAsentoUnaPersona(consulta: ConsultaAtendida): boolean {
  return !consulta.asentada_automaticamente;
}

export function sinHistorialCargado(fila: ConsultaAtendidaConPaciente): boolean {
  return fila.eventos_clinicos_n === 0;
}
