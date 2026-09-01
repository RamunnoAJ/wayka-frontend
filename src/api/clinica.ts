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
  hora_apertura: HoraDelDia;
  hora_cierre: HoraDelDia;
  /**
   * Define la grilla del calendario: la hora de una Cita tiene que ser múltiplo
   * de este valor contado desde `hora_apertura` (regla 2.2).
   */
  duracion_turno_minutos: number;
  /**
   * Nombre IANA de la zona en la que se interpretan el horario de atención y la
   * hora de las Citas. `hora_apertura` dice "09:00" sin decir 09:00 de dónde, y
   * esa pregunta la contesta la clínica.
   */
  zona_horaria: string;
  created_at: string;
  updated_at: string;
}

/**
 * Los tres campos de horario se validan como conjunto contra el estado
 * resultante, no de a uno: mover solo el cierre puede dejar un intervalo que la
 * duración del turno ya no divide.
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
  hora_apertura?: HoraDelDia;
  hora_cierre?: HoraDelDia;
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
