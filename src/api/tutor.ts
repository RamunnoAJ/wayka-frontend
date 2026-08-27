import { http } from '../lib/http';

import type { TipoDocumento } from './veterinario';

/**
 * Fichas de tutor.
 *
 * La **búsqueda** no está acotada por clínica (es como el veterinario resuelve
 * si el tutor ya existe antes de que haya ningún vínculo), pero **leer una
 * ficha concreta** sí exige vínculo con la clínica: que el tutor tenga un
 * Paciente vigente ahí, o que la ficha la haya creado esa misma clínica
 * (Reglas de Negocio, 3.2).
 */

export interface Tutor {
  id: string;
  nombre: string;
  tipo_documento?: TipoDocumento | null;
  numero_documento?: string | null;
  contacto: string;
  direccion?: string | null;
  consentimiento_datos: boolean;
  /**
   * Momento del otorgamiento. La API no expone `clinica_de_origen_id` aunque el
   * modelo lo lleve: el alcance sobre la ficha lo resuelve el backend.
   */
  consentimiento_fecha?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FiltrosDeTutores {
  busqueda?: string;
  limite?: number;
  desplazamiento?: number;
}

export function listarTutores(filtros: FiltrosDeTutores = {}): Promise<Tutor[]> {
  return http.get<Tutor[]>('/tutores', { params: { ...filtros } });
}

export function obtenerTutor(tutorId: string): Promise<Tutor> {
  return http.get<Tutor>(`/tutores/${tutorId}`);
}
