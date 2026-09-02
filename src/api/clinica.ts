import { http } from '../lib/http';

/**
 * Clínica: datos administrativos y horario de atención.
 *
 * El alta y la baja no existen en la API — las hace el administrador de la
 * plataforma por línea de comandos (proceso 4.10). Acá solo se lee y se edita.
 */

/** Hora de reloj `HH:MM`, sin segundos ni zona (Modelo de Datos, 4.3). */
export type HoraDelDia = string;

export interface Clinica {
  id: string;
  nombre: string;
  direccion: string;
  /** El punto confirmado en el mapa; los tres juntos o ninguno (regla 2.6). */
  direccion_place_id?: string | null;
  direccion_lat?: number | null;
  direccion_lng?: number | null;
  contacto: string;
  /**
   * Junto con las franjas de atención define la grilla: la hora de una Cita
   * tiene que ser múltiplo de este valor contado desde el `hora_desde` de la
   * franja en la que cae (regla 2.2).
   *
   * Se queda en la clínica y no baja a la franja porque el turno es cuánto dura
   * atender a un paciente ahí, y eso no cambia porque sea martes a la mañana o
   * jueves a la tarde.
   */
  duracion_turno_minutos: number;
  /**
   * Nombre IANA de la zona en la que se interpretan las franjas de atención y la
   * hora de las Citas. `hora_desde` dice "09:00" sin decir 09:00 de dónde, y esa
   * pregunta la contesta la clínica.
   */
  zona_horaria: string;
  created_at: string;
  updated_at: string;
}

/**
 * El horario de atención no se edita por acá: son las franjas, y se escriben
 * enteras contra su propia ruta. La duración del turno sí, porque es de la
 * clínica y no de la franja — y se valida contra las franjas vigentes.
 */
export interface ActualizarClinicaEntrada {
  nombre?: string;
  /**
   * A diferencia de la ficha de tutor, la clínica no puede quedarse sin
   * dirección: una clínica sin domicilio no se puede visitar. Mandarla sin los
   * tres campos del punto lo limpia igual (regla 2.6).
   */
  direccion?: string;
  direccion_place_id?: string;
  direccion_lat?: number;
  direccion_lng?: number;
  contacto?: string;
  duracion_turno_minutos?: number;
  zona_horaria?: string;
}

/**
 * La proyección pública: lo que una clínica publica en su cartel. Sin horario de
 * atención ni plantel — eso lo lee quien trabaja ahí, no quien está eligiendo
 * veterinaria.
 */
export interface ClinicaPublica {
  id: string;
  nombre: string;
  direccion: string;
  contacto: string;
}

export interface FiltrosDeClinicas {
  busqueda?: string;
  limite?: number;
  desplazamiento?: number;
}

/**
 * El directorio: es cómo el tutor elige con qué clínica compartir su mascota. Lo
 * alcanza cualquier cuenta autenticada, porque antes de compartir no hay vínculo
 * contra el cual acotarlo.
 */
export function buscarClinicas(filtros: FiltrosDeClinicas = {}): Promise<ClinicaPublica[]> {
  return http.get<ClinicaPublica[]>('/clinicas', { params: { ...filtros } });
}

export function obtenerClinica(clinicaId: string): Promise<Clinica> {
  return http.get<Clinica>(`/clinicas/${clinicaId}`);
}

export function actualizarClinica(
  clinicaId: string,
  entrada: ActualizarClinicaEntrada,
): Promise<Clinica> {
  return http.patch<Clinica>(`/clinicas/${clinicaId}`, { body: entrada });
}

/** 0 = lunes, 6 = domingo. La semana de una veterinaria empieza el lunes. */
export type DiaDeLaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DIAS_DE_LA_SEMANA: DiaDeLaSemana[] = [0, 1, 2, 3, 4, 5, 6];

export const NOMBRE_DEL_DIA: Record<DiaDeLaSemana, string> = {
  0: 'Lunes',
  1: 'Martes',
  2: 'Miércoles',
  3: 'Jueves',
  4: 'Viernes',
  5: 'Sábado',
  6: 'Domingo',
};

/**
 * Un tramo en el que la clínica atiende. No lleva id: las franjas se escriben
 * como conjunto y no se referencian de a una.
 */
export interface FranjaDeAtencion {
  dia_semana: DiaDeLaSemana;
  hora_desde: HoraDelDia;
  hora_hasta: HoraDelDia;
}

/**
 * El horario de atención completo. Un día que no aparece en `franjas` es un día
 * cerrado: no hay un campo que lo diga, porque un booleano que pudiera
 * contradecir a las franjas del mismo día sería un dato a mantener coherente a
 * mano (Modelo de Datos, 4.18).
 */
export interface Grilla {
  franjas: FranjaDeAtencion[];
  duracion_turno_minutos: number;
  zona_horaria: string;
}

export interface EscribirGrillaEntrada {
  franjas: FranjaDeAtencion[];
}

export interface TurnosPorDia {
  dia_semana: DiaDeLaSemana;
  turnos: number;
}

/**
 * Qué pasaría si esa grilla se guardara, sin guardarla. Existe porque achicar el
 * horario se rechaza mientras haya Citas pendientes fuera de la grilla nueva, y
 * descubrirlo recién en el texto de un error obliga a corregir a ciegas hasta
 * que el guardado deje de fallar (Alcance de Plataformas, 3.2.3).
 */
export interface PrevisualizacionDeGrilla {
  turnos_por_dia: TurnosPorDia[];
  /** Solo el instante: ni paciente, ni tipo, ni profesional. */
  citas_que_quedan_afuera: string[];
}

export function obtenerGrilla(clinicaId: string): Promise<Grilla> {
  return http.get<Grilla>(`/clinicas/${clinicaId}/franjas`);
}

/**
 * Reemplaza el conjunto entero en una transacción. No hay alta ni baja de una
 * franja suelta: la grilla es una sola cosa y hay que poder validarla completa
 * antes de aceptarla.
 */
export function escribirGrilla(clinicaId: string, entrada: EscribirGrillaEntrada): Promise<Grilla> {
  return http.put<Grilla>(`/clinicas/${clinicaId}/franjas`, { body: entrada });
}

export function previsualizarGrilla(
  clinicaId: string,
  entrada: EscribirGrillaEntrada,
): Promise<PrevisualizacionDeGrilla> {
  return http.post<PrevisualizacionDeGrilla>(`/clinicas/${clinicaId}/franjas/previsualizacion`, {
    body: entrada,
  });
}
