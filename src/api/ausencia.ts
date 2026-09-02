import { http } from '../lib/http';

/**
 * Ausencias del plantel: cuándo alguien no está disponible para atender.
 *
 * No llevan motivo, y no es un olvido — el motivo de la ausencia de un empleado
 * puede ser un dato de salud, y para que la grilla no le ofrezca turnos a quien
 * no va a estar alcanza con el rango (Modelo de Datos, 4.19). La pantalla
 * tampoco tiene dónde escribirlo.
 */
export interface Ausencia {
  id: string;
  veterinario_id: string;
  desde: string;
  hasta: string;
  registrada_por_usuario_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrearAusenciaEntrada {
  veterinario_id: string;
  desde: string;
  hasta: string;
}

/**
 * La ausencia junto con lo que su carga provocó. Las dos cosas viajan juntas
 * porque el efecto es la mitad de la respuesta: la pantalla tiene que poder
 * decir cuántas citas quedaron sin profesional.
 */
export interface AusenciaCreada {
  ausencia: Ausencia;
  citas_desasignadas: number;
}

/**
 * Qué citas quedarían sin profesional. Es informativo y no un permiso: la
 * ausencia se guarda igual, porque impedir registrar que alguien no vino no hace
 * que haya venido.
 */
export interface PrevisualizacionDeAusencia {
  citas_afectadas: number;
  /** Los momentos de esas citas, sin paciente ni tipo. */
  horarios: string[];
}

export interface FiltrosDeAusencias {
  veterinarioId?: string;
  desde?: string;
  hasta?: string;
}

/** La clínica no viaja: se resuelve contra el actor, como toda la gestión del plantel. */
export function listarAusencias(filtros: FiltrosDeAusencias = {}): Promise<Ausencia[]> {
  return http.get<Ausencia[]>('/ausencias', { params: { ...filtros } });
}

export function crearAusencia(entrada: CrearAusenciaEntrada): Promise<AusenciaCreada> {
  return http.post<AusenciaCreada>('/ausencias', { body: entrada });
}

export function previsualizarAusencia(
  entrada: CrearAusenciaEntrada,
): Promise<PrevisualizacionDeAusencia> {
  return http.post<PrevisualizacionDeAusencia>('/ausencias/previsualizacion', { body: entrada });
}

/**
 * Baja lógica. **No reasigna nada**: las citas que se desasignaron al cargarla
 * siguen sin profesional y se reparten como cualquier otra.
 */
export function darDeBajaAusencia(ausenciaId: string): Promise<void> {
  return http.delete<void>(`/ausencias/${ausenciaId}`);
}
