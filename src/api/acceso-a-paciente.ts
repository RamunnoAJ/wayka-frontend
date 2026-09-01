import { http } from '../lib/http';
import type { NivelDeAcceso } from './paciente';

/**
 * Con quién comparte una mascota su dueño: las clínicas que la atienden y las
 * personas que la ven. Tipado a mano contra `openapi/openapi.yaml`, tag Accesos.
 *
 * Otorgar y revocar es del dueño. Un veterinario solo puede desvincular su
 * propia clínica, y un co-tutor renunciar a su acceso.
 */
const RUTA = '/pacientes';

export interface VinculoConClinica {
  clinica_id: string;
  nombre: string;
  direccion?: string;
  otorgado_at: string;
}

export interface CoTutor {
  tutor_id: string;
  nombre: string;
  /**
   * Viaja porque el veterinario necesita saber a quién llamar: con una sola
   * persona por mascota eso era implícito, y ahora no lo es.
   */
  contacto?: string;
  nivel: Exclude<NivelDeAcceso, 'dueno'>;
  otorgado_at: string;
}

export interface AccesosDelPaciente {
  clinicas: VinculoConClinica[];
  co_tutores: CoTutor[];
}

/**
 * Lo lee cualquiera que alcance la mascota, incluido el co-tutor de solo
 * lectura: saber quién más mira el historial de un animal no es administrar, es
 * lo mínimo para entender con quién se está compartiendo.
 */
export function listarAccesos(pacienteId: string): Promise<AccesosDelPaciente> {
  return http.get<AccesosDelPaciente>(`${RUTA}/${pacienteId}/accesos`);
}

/**
 * A partir de acá, **todo el plantel vigente de esa clínica** alcanza la
 * mascota: lee su historial completo —incluido lo que escribieron otras
 * clínicas—, escribe eventos y medicación, y agenda en su propia agenda. La
 * pantalla lo tiene que decir antes de confirmar, no después.
 */
export function compartirConClinica(pacienteId: string, clinicaId: string): Promise<null> {
  return http.post<null>(`${RUTA}/${pacienteId}/clinicas`, { body: { clinica_id: clinicaId } });
}

/**
 * Lo ejerce el dueño sobre cualquier clínica, o un veterinario sobre la suya.
 * Se rechaza con 409 mientras esa clínica tenga citas pendientes de esa mascota.
 *
 * Lo que esa clínica escribió queda con su autoría: lo que pierde es el acceso
 * de ahí en adelante.
 */
export function revocarClinica(pacienteId: string, clinicaId: string): Promise<null> {
  return http.delete<null>(`${RUTA}/${pacienteId}/clinicas/${clinicaId}`);
}

export function cambiarNivelDeAcceso(
  pacienteId: string,
  tutorId: string,
  nivel: Exclude<NivelDeAcceso, 'dueno'>,
): Promise<null> {
  return http.patch<null>(`${RUTA}/${pacienteId}/co-tutores/${tutorId}`, { body: { nivel } });
}

/**
 * El efecto en el servidor es inmediato; en un teléfono sin señal, no: la copia
 * local se purga cuando el aparato sincroniza. El diálogo de confirmación lo
 * dice, en vez de prometer un corte instantáneo que el sistema no controla.
 */
export function revocarCoTutor(pacienteId: string, tutorId: string): Promise<null> {
  return http.delete<null>(`${RUTA}/${pacienteId}/co-tutores/${tutorId}`);
}

/**
 * Dejar de ver una mascota que no es propia no necesita permiso de nadie. El
 * dueño no puede: para dejar de tenerla está la baja.
 */
export function renunciarAlAcceso(pacienteId: string): Promise<null> {
  return http.delete<null>(`${RUTA}/${pacienteId}/acceso`);
}
