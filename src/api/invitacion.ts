import { http } from '../lib/http';
import type { NivelDeAcceso } from './paciente';

/**
 * Invitaciones de co-tutor. Tipado a mano contra `openapi/openapi.yaml`, tag
 * Invitaciones.
 *
 * La invitación se dirige a un correo y no a un usuario, porque quien la recibe
 * puede todavía no tener cuenta: ese es el caso que existe para resolver.
 */
const RUTA_PACIENTES = '/pacientes';
const RUTA = '/invitaciones';

export type NivelInvitado = Exclude<NivelDeAcceso, 'dueno'>;

export interface Invitacion {
  id: string;
  email: string;
  nivel: NivelInvitado;
  expira_at: string;
  created_at: string;
}

/**
 * Lo único que ve quien todavía no aceptó: qué mascota es, con qué nivel y quién
 * lo invita. Nada del historial —aceptar es lo que da acceso a él— y nunca si
 * ese correo tiene cuenta en Wayka.
 */
export interface InvitacionVistaPrevia {
  nombre_del_paciente: string;
  invitado_por: string;
  nivel: NivelInvitado;
  expira_at: string;
}

export interface InvitarCoTutorEntrada {
  email: string;
  nivel: NivelInvitado;
}

/**
 * **No devuelve el token**: quien lo recibe es el destinatario, por correo.
 * Devolvérselo a quien invita convertiría el enlace en algo que se reenvía desde
 * la pantalla, y la invitación dejaría de estar dirigida.
 *
 * Reinvitar al mismo correo anula la anterior, en vez de dejar dos enlaces
 * vivos.
 */
export function invitarCoTutor(pacienteId: string, entrada: InvitarCoTutorEntrada): Promise<null> {
  return http.post<null>(`${RUTA_PACIENTES}/${pacienteId}/invitaciones`, { body: entrada });
}

export function listarInvitaciones(pacienteId: string): Promise<Invitacion[]> {
  return http.get<Invitacion[]>(`${RUTA_PACIENTES}/${pacienteId}/invitaciones`);
}

export function anularInvitacion(pacienteId: string, invitacionId: string): Promise<null> {
  return http.delete<null>(`${RUTA_PACIENTES}/${pacienteId}/invitaciones/${invitacionId}`);
}

/**
 * Público: quien recibe el enlace puede no tener cuenta todavía. El token viaja
 * en el cuerpo y por POST, nunca en la URL — una query string termina en el log
 * de acceso, y los tokens no se loguean.
 */
export function verInvitacion(token: string): Promise<InvitacionVistaPrevia> {
  return http.post<InvitacionVistaPrevia>(`${RUTA}/vista-previa`, { body: { token } });
}

/**
 * Exige estar autenticado como tutor **con el correo al que se dirigió la
 * invitación**, y con el consentimiento de uso de datos otorgado.
 */
export function canjearInvitacion(token: string): Promise<null> {
  return http.post<null>(`${RUTA}/canje`, { body: { token } });
}
