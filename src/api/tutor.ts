import { http } from '../lib/http';

import type { TipoDocumento } from './veterinario';

// Reexportado: el documento de un tutor y el de un veterinario son el mismo
// enum del contrato, y quien tipa un formulario de tutor no deberia tener que
// importarlo del modulo de veterinarios.
export type { TipoDocumento };

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
  /** Coincidencia parcial, sin distinguir mayúsculas, sobre nombre o contacto. */
  busqueda?: string;
  tipo_documento?: TipoDocumento;
  numero_documento?: string;
  limite?: number;
  desplazamiento?: number;
}

export interface CrearTutorEntrada {
  nombre: string;
  contacto: string;
  tipo_documento?: TipoDocumento;
  numero_documento?: string;
  direccion?: string;
  /**
   * Ley 25.326. Sin consentimiento no se puede dar de alta un Paciente para esta
   * persona (regla 2.2), así que el alta lo exige desde el principio.
   */
  consentimiento_datos: boolean;
}

/**
 * El consentimiento **no está**: no se revoca por la API. La ley exige rastro
 * del otorgamiento, no una baja silenciosa (Modelo de Datos, 4.1).
 */
export interface ActualizarTutorEntrada {
  nombre?: string;
  contacto?: string;
  /** Cadena vacía limpia el documento; el tipo y el número se cargan juntos. */
  tipo_documento?: TipoDocumento | '';
  numero_documento?: string;
  direccion?: string;
}

export function listarTutores(filtros: FiltrosDeTutores = {}): Promise<Tutor[]> {
  return http.get<Tutor[]>('/tutores', { params: { ...filtros } });
}

export function obtenerTutor(tutorId: string): Promise<Tutor> {
  return http.get<Tutor>(`/tutores/${tutorId}`);
}

export function crearTutor(entrada: CrearTutorEntrada): Promise<Tutor> {
  return http.post<Tutor>('/tutores', { body: entrada });
}

export function actualizarTutor(tutorId: string, entrada: ActualizarTutorEntrada): Promise<Tutor> {
  return http.patch<Tutor>(`/tutores/${tutorId}`, { body: entrada });
}

/**
 * Baja lógica. **Se rechaza mientras la ficha tenga Pacientes vigentes** (regla
 * 2.4): dar de baja al tutor dejaría mascotas activas sin nadie a quien
 * contactar. No cascadea sobre su cuenta de Usuario.
 */
export function darDeBajaTutor(tutorId: string): Promise<null> {
  return http.delete<null>(`/tutores/${tutorId}`);
}
