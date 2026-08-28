import { http } from '../lib/http';

/**
 * Recuperación de contraseña sin sesión. Es la única salida de quien la olvidó y
 * no tiene a nadie que se la restablezca: al veterinario se la puede restablecer
 * su clínica_admin, pero al tutor no lo alcanza ninguna clínica.
 *
 * Los dos endpoints son públicos —quien los llama no tiene sesión, que es el
 * problema que vienen a resolver— y por eso van con `publico: true`: mandar un
 * Authorization vencido haría que el interceptor intente refrescar por nada.
 */

/**
 * **Responde 204 exista o no la cuenta.** El backend contesta igual a propósito:
 * contestar distinto convertiría el endpoint en una forma de averiguar qué
 * direcciones están registradas. La pantalla dice lo mismo en los dos casos.
 */
export function pedirRecuperacion(email: string): Promise<null> {
  return http.post<null>('/auth/recuperacion', { body: { email }, publico: true });
}

/** Canjea el token del correo. No devuelve sesión: después hay que entrar. */
export function canjearRecuperacion(token: string, contrasena: string): Promise<null> {
  return http.post<null>('/auth/recuperacion/canje', {
    body: { token, contrasena },
    publico: true,
  });
}
