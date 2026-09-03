import { http } from '../lib/http';

import type { OrigenDeCarga, PrecisionDeFecha } from './historial';

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

/**
 * En las tres formas, lo opcional es lo que el contrato afloja cuando el
 * registro lo declara el tutor: el lote está impreso en el frasco, la severidad
 * es un juicio clínico y la dosis a veces es "media pastilla a la mañana". Lo
 * que identifica al antecedente —la vacuna, el alérgeno, la droga— es
 * obligatorio para los dos orígenes.
 *
 * El tipo no distingue los dos casos porque el mismo objeto viaja en las dos
 * direcciones; quien arma el formulario exige según el origen (Modelo de Datos,
 * 4.5).
 */
export interface CamposDeVacuna {
  nombre_vacuna: string;
  lote?: string | null;
  fecha_proxima_dosis?: string | null;
}

export interface CamposDeMedicacion {
  nombre_droga: string;
  dosis?: string | null;
  frecuencia?: string | null;
}

export interface CamposDeAlergia {
  alergeno: string;
  severidad?: SeveridadDeAlergia | null;
  reaccion?: string | null;
}

export type CampoEstructurado = CamposDeVacuna | CamposDeMedicacion | CamposDeAlergia;

export interface EventoClinico {
  id: string;
  paciente_id: string;
  /**
   * Cuenta que escribió el registro. No se reasigna al editar: dice quién lo
   * cargó, no quién corrigió el texto. Es una cuenta y no un veterinario porque
   * escriben los dos roles — cuál de los dos lo dice `cargado_por`.
   */
  usuario_id: string;
  /**
   * Acto médico del profesional, o antecedente que declaró el tutor. **La
   * interfaz está obligada a distinguirlos**, y de forma imposible de pasar por
   * alto en la vista de urgencia (Modelo de Datos, 4.5).
   */
  cargado_por: OrigenDeCarga;
  tipo: TipoDeEvento;
  /**
   * ISO `YYYY-MM-DD`. Nunca futura: lo que va a pasar es una Cita.
   *
   * **No se muestra sin leer `fecha_precision` al lado**: los componentes que la
   * precisión declara desconocidos vienen rellenados con `01`, y presentarlos
   * como si fueran una fecha exacta es mostrar un día que nadie declaró.
   */
  fecha: string;
  fecha_precision: PrecisionDeFecha;
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
  /**
   * Omitirlo declara una fecha exacta. Un valor distinto de `dia` solo lo admite
   * un antecedente del tutor: el veterinario carga con la fecha delante.
   */
  fecha_precision?: PrecisionDeFecha;
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
