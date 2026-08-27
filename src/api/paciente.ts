import { http } from '../lib/http';

/**
 * Pacientes. Tipado a mano contra `openapi/openapi.yaml` (doc 08, sección 7).
 *
 * El listado es un endpoint con dos alcances y el rol del token decide cuál
 * aplica: el veterinario ve la cartera de su clínica, el tutor sus mascotas.
 * No hay parámetro para elegirlo — pedirlo sería inventar una regla.
 */
const RUTA = '/pacientes';

export interface Paciente {
  id: string;
  nombre: string;
  especie: string;
  raza: string;
  /** ISO `YYYY-MM-DD`. */
  fecha_nacimiento: string;
  sexo: string;
  peso_actual: number;
  tutor_id: string;
  /** Fija desde el alta: no es editable en el MVP (regla 2.2). */
  clinica_id: string;
  /** Número de chip. Único entre fichas vigentes cuando está cargado. */
  identificador_externo?: string | null;
  created_at: string;
  updated_at: string;
  /**
   * Momento de la baja lógica, o null si la ficha está vigente. Es el único
   * recurso del contrato que lo expone: la ficha de una mascota dada de baja se
   * sigue leyendo con todo su historial pero no admite escrituras nuevas, y sin
   * este campo no habría cómo distinguirla de una vigente (regla 4.5).
   *
   * En los listados siempre viene en null, porque filtran las bajas.
   */
  deleted_at?: string | null;
}

/** Regla 4.5: la ficha de baja se lee, pero no admite escrituras nuevas. */
export function estaDadoDeBaja(paciente: Paciente): boolean {
  return paciente.deleted_at != null;
}

export interface FiltrosDePacientes {
  busqueda?: string;
  tutor_id?: string;
  limite?: number;
  desplazamiento?: number;
}

/**
 * Campos editables de la ficha. `clinica_id` y `tutor_id` no están y no es un
 * olvido: la primera es fija en el MVP y cambiar la segunda sería transferir la
 * mascota a otra persona sin dejar rastro (Modelo de Datos, 4.2).
 *
 * El tutor solo puede mandar `peso_actual`; cualquier otro campo hace que el
 * backend rechace la operación.
 */
export interface ActualizarPacienteEntrada {
  nombre?: string;
  especie?: string;
  raza?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  peso_actual?: number;
  /** `""` limpia el valor guardado. */
  identificador_externo?: string;
}

/**
 * La clínica **no se envía**: es la del veterinario que da el alta, y queda fija
 * (regla 2.2). El tutor tiene que existir y tener el consentimiento otorgado
 * antes de este paso (proceso 4.1).
 */
export interface CrearPacienteEntrada {
  nombre: string;
  especie: string;
  raza: string;
  fecha_nacimiento: string;
  sexo: string;
  peso_actual: number;
  tutor_id: string;
  identificador_externo?: string;
}

export function crearPaciente(entrada: CrearPacienteEntrada): Promise<Paciente> {
  return http.post<Paciente>(RUTA, { body: entrada });
}

export function listarPacientes(filtros: FiltrosDePacientes = {}): Promise<Paciente[]> {
  return http.get<Paciente[]>(RUTA, { params: { ...filtros } });
}

export function obtenerPaciente(pacienteId: string): Promise<Paciente> {
  return http.get<Paciente>(`${RUTA}/${pacienteId}`);
}

export function actualizarPaciente(
  pacienteId: string,
  entrada: ActualizarPacienteEntrada,
): Promise<Paciente> {
  return http.patch<Paciente>(`${RUTA}/${pacienteId}`, { body: entrada });
}

/**
 * Baja **lógica**: no cascadea. El historial, la medicación, las citas y los
 * adjuntos siguen consultables desde la ficha (regla 4.5). El copy de la UI no
 * debería decir "eliminar".
 */
export function darDeBajaPaciente(pacienteId: string): Promise<null> {
  return http.delete<null>(`${RUTA}/${pacienteId}`);
}
