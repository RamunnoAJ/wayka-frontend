import { http } from '../lib/http';

/**
 * Plantel de la clínica.
 *
 * El veterinario **lee** el plantel de su propia clínica pero no lo modifica:
 * lo necesita para resolver quién firmó cada registro clínico (Alcance de
 * Plataformas, 3.3). Escribirlo es del clínica_admin.
 */

export type TipoDocumento = 'dni' | 'pasaporte' | 'otro';

export interface Veterinario {
  id: string;
  nombre: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  /**
   * Habilitación profesional. **Vacía deja la ficha en modo restringido**: sin
   * matrícula no se crean ni editan Eventos clínicos ni Medicación (regla 2.1).
   */
  matricula?: string | null;
  clinica_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Alta del plantel: la ficha y la cuenta de acceso se crean **juntas, en una
 * sola operación** (proceso 4.12). No hay forma de crear una sin la otra, y la
 * clínica no se envía — es siempre la del administrador que da el alta.
 */
export interface CrearVeterinarioEntrada {
  nombre: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  /** Opcional: sin ella la ficha nace en modo restringido (regla 2.1). */
  matricula?: string;
  email: string;
  /** Mínimo 8, con minúscula, mayúscula y dígito. El backend decide. */
  contrasena: string;
}

export type ActualizarVeterinarioEntrada = Partial<
  Pick<CrearVeterinarioEntrada, 'nombre' | 'tipo_documento' | 'numero_documento' | 'matricula'>
>;

/** Ficha + cuenta, tal como las devuelve el alta. */
export interface VeterinarioConCuenta {
  veterinario: Veterinario;
  usuario: { id: string; email: string; activo: boolean };
}

export function crearVeterinario(entrada: CrearVeterinarioEntrada): Promise<VeterinarioConCuenta> {
  return http.post<VeterinarioConCuenta>('/veterinarios', { body: entrada });
}

export function actualizarVeterinario(
  veterinarioId: string,
  entrada: ActualizarVeterinarioEntrada,
): Promise<Veterinario> {
  return http.patch<Veterinario>(`/veterinarios/${veterinarioId}`, { body: entrada });
}

/**
 * Baja lógica de la ficha **y desactivación de la cuenta en la misma
 * transacción** (regla 2.4): separarlas dejaría a un ex empleado con acceso.
 * No cascadea sobre lo que escribió: eventos y medicación conservan su autoría.
 */
export function darDeBajaVeterinario(veterinarioId: string): Promise<null> {
  return http.delete<null>(`/veterinarios/${veterinarioId}`);
}

export function listarVeterinarios(): Promise<Veterinario[]> {
  return http.get<Veterinario[]>('/veterinarios');
}

export function obtenerVeterinario(veterinarioId: string): Promise<Veterinario> {
  return http.get<Veterinario>(`/veterinarios/${veterinarioId}`);
}

/**
 * Índice `id → nombre` para resolver la autoría de eventos y medicación sin
 * pedir una ficha por registro. El backend no devuelve el nombre embebido: los
 * registros clínicos llevan `veterinario_id` y nada más.
 */
export function indexarPorId(veterinarios: Veterinario[]): Map<string, Veterinario> {
  return new Map(veterinarios.map((v) => [v.id, v]));
}

/** Regla 2.1, reflejada en la UI: sin matrícula, la ficha es de solo lectura. */
export function puedeEscribirClinico(veterinario: Veterinario | undefined): boolean {
  return Boolean(veterinario?.matricula);
}
