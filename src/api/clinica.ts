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
  contacto: string;
  hora_apertura: HoraDelDia;
  hora_cierre: HoraDelDia;
  /**
   * Define la grilla del calendario: la hora de una Cita tiene que ser múltiplo
   * de este valor contado desde `hora_apertura` (regla 2.2).
   */
  duracion_turno_minutos: number;
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
  direccion?: string;
  contacto?: string;
  hora_apertura?: HoraDelDia;
  hora_cierre?: HoraDelDia;
  duracion_turno_minutos?: number;
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
