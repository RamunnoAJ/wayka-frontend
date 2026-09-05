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
  /**
   * El punto confirmado en el mapa. Los tres van juntos o no va ninguno: una
   * dirección escrita a mano —o editada sin conexión— se guarda con los tres
   * en null (Reglas de Negocio, 2.6).
   */
  direccion_place_id?: string | null;
  direccion_lat?: number | null;
  direccion_lng?: number | null;
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
  /**
   * Coincidencia parcial, sin distinguir mayúsculas, sobre nombre o contacto; o
   * por el **comienzo del número de documento**. Es un campo contra los tres
   * datos: quien busca tiene lo que la persona le dijo —un apellido, un
   * teléfono, un DNI— y no debería tener que declarar antes cuál de las tres
   * cosas es.
   */
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
  direccion_place_id?: string;
  direccion_lat?: number;
  direccion_lng?: number;
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
  /**
   * Cadena vacía limpia la dirección y su punto. Mandar la dirección **sin** los
   * tres campos del punto también lo limpia: el texto nuevo describe otro lugar
   * y conservar las coordenadas dejaría el pin en la casa anterior (regla 2.6).
   */
  direccion?: string;
  direccion_place_id?: string;
  direccion_lat?: number;
  direccion_lng?: number;
}

/**
 * La búsqueda del veterinario devuelve la **misma proyección reducida** que el
 * padrón del clínica_admin, no la ficha completa: no se acota por clínica —antes
 * del alta no hay vínculo contra el cual acotarla— así que lo que protege el dato
 * es la proyección. El documento y la dirección salen solo por `obtenerTutor`,
 * que sí exige vínculo (Reglas de Negocio, 3.2).
 *
 * **Sin criterio el backend responde 400.** El buscador existe para encontrar a
 * una persona de la que ya se sabe algo; un listado sin filtro es el padrón
 * entero.
 */
export function listarTutores(filtros: FiltrosDeTutores = {}): Promise<TutorEnElPadron[]> {
  return http.get<TutorEnElPadron[]>('/tutores', { params: { ...filtros } });
}

/**
 * Lo que el clínica_admin ve de una persona del padrón: cómo se llama, cómo
 * contactarla, y si la ficha ya tiene el documento cargado o le falta. El número
 * no sale nunca — el booleano alcanza para saber si la ficha está completa sin
 * exponerlo.
 *
 * Es una proyección y no una ficha recortada: el backend no selecciona el resto
 * de las columnas.
 */
export interface TutorEnElPadron {
  id: string;
  nombre: string;
  contacto: string;
  tiene_documento: boolean;
  /**
   * Precondición del proceso que la búsqueda sirve: sin consentimiento no se le
   * da de alta una mascota a esa persona (regla 2.2), y la pantalla tiene que
   * poder decirlo **antes** del intento y no como el texto de un error (Alcance
   * de Plataformas, 3.3).
   */
  consentimiento_datos: boolean;
}

/**
 * El padrón: cómo el mostrador resuelve si la persona que llama ya está, antes
 * de darle de alta la mascota (proceso 4.1).
 *
 * **No se acota por clínica**, igual que `listarTutores`: antes del alta no hay
 * ningún vínculo contra el cual acotar. Lo que cambia es la proyección.
 */
export function listarPadron(filtros: FiltrosDeTutores = {}): Promise<TutorEnElPadron[]> {
  return http.get<TutorEnElPadron[]>('/padron', { params: { ...filtros } });
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
