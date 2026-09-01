import { http } from '../lib/http';

/**
 * Historial clínico. Tipado a mano contra `openapi/openapi.yaml`.
 *
 * `campo_estructurado` **no es un JSON libre**: su forma la fija el `tipo` del
 * evento y la valida el backend (Modelo de Datos, 4.5). Los tipos de acá
 * transcriben ese esquema para que un formulario no pueda armar una carga que
 * el backend va a rechazar.
 */

export const TIPO_DE_EVENTO = {
  CONSULTA: 'consulta',
  VACUNA: 'vacuna',
  CIRUGIA: 'cirugia',
  CONTROL: 'control',
  URGENCIA: 'urgencia',
  MEDICACION: 'medicacion',
  ALERGIA: 'alergia',
} as const;

export type TipoDeEvento = (typeof TIPO_DE_EVENTO)[keyof typeof TIPO_DE_EVENTO];

export type SeveridadDeAlergia = 'leve' | 'moderada' | 'severa';

export interface CamposDeVacuna {
  nombre_vacuna: string;
  lote: string;
  fecha_proxima_dosis?: string | null;
}

export interface CamposDeMedicacion {
  nombre_droga: string;
  dosis: string;
  frecuencia: string;
}

export interface CamposDeAlergia {
  alergeno: string;
  severidad: SeveridadDeAlergia;
  reaccion?: string | null;
}

export type CampoEstructurado = CamposDeVacuna | CamposDeMedicacion | CamposDeAlergia;

export interface EventoClinico {
  id: string;
  paciente_id: string;
  /**
   * Autor original. No se reasigna al editar: dice quién atendió, no quién
   * corrigió el texto. Un colega de la misma clínica puede editar y dar de baja
   * el evento sin que este campo cambie (Reglas de Negocio, 3.2).
   */
  veterinario_id: string;
  tipo: TipoDeEvento;
  /** ISO `YYYY-MM-DD`. Nunca futura: lo que va a pasar es una Cita. */
  fecha: string;
  descripcion: string;
  diagnostico?: string | null;
  campo_estructurado?: CampoEstructurado | null;
  /**
   * Cita que esta atención vino a cumplir; null si no estaba agendada o si el
   * evento no tiene asiento. Es **derivado y de solo lectura**: sale de la
   * atención, porque el evento ya no guarda su propia FK a la cita — de una misma
   * atención cuelgan varios eventos y solo uno podía quedarse con ella.
   */
  cita_id?: string | null;
  /**
   * Atención en la que se escribió (Modelo de Datos, 4.16); null cuando no hay
   * asiento: una carga histórica, o una atención que nadie asentó.
   */
  consulta_id?: string | null;
  created_at: string;
  updated_at: string;
}

/** Estrecha el campo estructurado según el tipo, sin castear a ciegas. */
export function camposDeVacuna(evento: EventoClinico): CamposDeVacuna | null {
  return evento.tipo === TIPO_DE_EVENTO.VACUNA
    ? (evento.campo_estructurado as CamposDeVacuna | null)
    : null;
}

export function camposDeAlergia(evento: EventoClinico): CamposDeAlergia | null {
  return evento.tipo === TIPO_DE_EVENTO.ALERGIA
    ? (evento.campo_estructurado as CamposDeAlergia | null)
    : null;
}

export interface FiltrosDeEventos {
  tipo?: TipoDeEvento;
  limite?: number;
  desplazamiento?: number;
}

export interface CrearEventoEntrada {
  tipo: TipoDeEvento;
  fecha: string;
  descripcion: string;
  diagnostico?: string;
  /** Obligatorio en vacuna, medicación y alergia; prohibido en el resto. */
  campo_estructurado?: CampoEstructurado;
  /**
   * Cita que esta carga cumple. Es un atajo: resuelve la atención de esa cita y,
   * si nadie la asentó todavía, la asienta —y con ella la cita queda cumplida—.
   * Ya no hay una cita por evento: si la atención ya tiene asiento, este evento
   * se suma a él.
   */
  cita_id?: string;
  /** La atención ya asentada desde la que se carga, cuando se entra desde ahí. */
  consulta_id?: string;
}

export type ActualizarEventoEntrada = Partial<Omit<CrearEventoEntrada, 'tipo'>>;

function rutaDePaciente(pacienteId: string): string {
  return `/pacientes/${pacienteId}/eventos-clinicos`;
}

/** Devuelve los eventos vigentes, de lo más reciente hacia atrás. */
export function listarEventosClinicos(
  pacienteId: string,
  filtros: FiltrosDeEventos = {},
): Promise<EventoClinico[]> {
  return http.get<EventoClinico[]>(rutaDePaciente(pacienteId), { params: { ...filtros } });
}

export function crearEventoClinico(
  pacienteId: string,
  entrada: CrearEventoEntrada,
): Promise<EventoClinico> {
  return http.post<EventoClinico>(rutaDePaciente(pacienteId), { body: entrada });
}

export function actualizarEventoClinico(
  eventoId: string,
  entrada: ActualizarEventoEntrada,
): Promise<EventoClinico> {
  return http.patch<EventoClinico>(`/eventos-clinicos/${eventoId}`, { body: entrada });
}

/** Baja lógica. Nunca borra: el evento deja de listarse y queda auditado. */
export function darDeBajaEventoClinico(eventoId: string): Promise<null> {
  return http.delete<null>(`/eventos-clinicos/${eventoId}`);
}
