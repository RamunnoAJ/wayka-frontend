import { http } from '../lib/http';

/**
 * Pacientes. Tipado a mano contra `openapi/openapi.yaml` (doc 08, sección 7).
 *
 * El listado es un endpoint con dos alcances y el rol del token decide cuál
 * aplica: el veterinario ve la cartera de su clínica, el tutor sus mascotas.
 * No hay parámetro para elegirlo — pedirlo sería inventar una regla.
 */
const RUTA = '/pacientes';

/**
 * Cuánto alcanza un tutor sobre una mascota. `edicion` hace lo mismo que el
 * dueño salvo administrar: no invita, no revoca y no da de baja la mascota.
 */
export type NivelDeAcceso = 'dueno' | 'edicion' | 'lectura';

/** El dueño es el único que administra los accesos (Reglas de Negocio, 3.2). */
export function puedeAdministrar(paciente: Paciente): boolean {
  return paciente.nivel_de_acceso === 'dueno';
}

/** Editar los datos no clínicos, la agenda y los adjuntos. */
export function puedeEditar(paciente: Paciente): boolean {
  return paciente.nivel_de_acceso === 'dueno' || paciente.nivel_de_acceso === 'edicion';
}

export interface Paciente {
  id: string;
  nombre: string;
  especie: string;
  raza: string;
  /** ISO `YYYY-MM-DD`. */
  fecha_nacimiento: string;
  sexo: string;
  peso_actual: number;
  /**
   * El dueño. No es editable: cambiarlo sería transferir la mascota a otra
   * persona sin dejar rastro. Dar acceso a otro tutor es otra cosa y vive en
   * `acceso-a-paciente.ts`.
   */
  tutor_id: string;
  /**
   * Cuánto alcanza sobre esta ficha el tutor que la está leyendo. No es una
   * columna: el backend lo resuelve por pedido contra los vínculos vigentes, y
   * viaja acá para que la pantalla sepa qué habilitar sin pedir un endpoint por
   * mascota. Ausente cuando quien lee no es un tutor.
   */
  nivel_de_acceso?: NivelDeAcceso;
  /** Número de chip. Único entre fichas vigentes cuando está cargado. */
  identificador_externo?: string | null;
  /**
   * Foto de la mascota: la URL prefirmada del adjunto marcado como foto de
   * perfil, o null si no tiene. Tampoco es una columna — el backend la resuelve
   * por pedido, con el mismo criterio que `nivel_de_acceso`, para que un listado
   * dibuje el avatar de cada fila sin pedir los adjuntos de cada mascota.
   *
   * **Ausente en la copia local**: es una URL de vida corta y no se replica
   * (Sincronización sin Conexión, 2), así que sin conexión el avatar vuelve al
   * ícono de la especie.
   */
  foto_perfil_url?: string | null;
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
 * Campos editables de la ficha. `tutor_id` no está y no es un olvido: cambiarlo
 * sería transferir la mascota a otra persona sin dejar rastro.
 *
 * Quien cuida al animal —el dueño y el co-tutor con edición— edita todos estos
 * campos salvo `identificador_externo`, que es del veterinario: lo implanta y lo
 * lee él, y es único entre fichas vigentes.
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
 * El alta tiene dos caminos. Un veterinario da de alta a nombre de un tutor —ahí
 * `tutor_id` es obligatorio— y su clínica queda vinculada a la mascota en la
 * misma operación. Un tutor da de alta la suya: `tutor_id` se ignora, porque el
 * dueño sale del token y nunca del cuerpo, y la mascota nace sin ninguna clínica
 * hasta que él la comparta.
 *
 * El chip solo lo carga el veterinario.
 */
export interface CrearPacienteEntrada {
  nombre: string;
  especie: string;
  raza: string;
  fecha_nacimiento: string;
  sexo: string;
  peso_actual: number;
  tutor_id?: string;
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
 *
 * La ejerce el dueño, y nadie más: ni un co-tutor con edición ni un veterinario.
 * Lo que el veterinario tiene en su lugar es desvincular su clínica.
 */
export function darDeBajaPaciente(pacienteId: string): Promise<null> {
  return http.delete<null>(`${RUTA}/${pacienteId}`);
}

/**
 * Lo que el clínica_admin ve de una mascota: cómo se llama, qué es, y a quién
 * llamar. Ni fecha de nacimiento, ni sexo, ni peso, ni chip.
 *
 * Es una proyección y no una ficha recortada: la consulta del servidor no trae
 * el resto de las columnas. Mismo criterio que `ClinicaPublica` en el directorio
 * — lo que protege el dato no es el alcance sino la proyección.
 */
export interface PacienteEnLaCartera {
  id: string;
  nombre: string;
  especie: string;
  tutor_nombre: string;
  tutor_contacto: string;
}

/**
 * La cartera de la clínica. Existe porque agendar exige elegir una mascota, y
 * sin poder nombrarla el mostrador no puede tomar un turno.
 */
export function listarCartera(filtros: FiltrosDePacientes = {}): Promise<PacienteEnLaCartera[]> {
  return http.get<PacienteEnLaCartera[]>('/cartera', { params: { ...filtros } });
}
