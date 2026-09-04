import { http } from '../lib/http';

/**
 * Confirmación de la dirección de correo (proceso 4.9.1).
 *
 * **No habilita nada.** Confirmar no es condición de ninguna operación: el tutor
 * entra, da de alta su primera mascota y le carga antecedentes sin esperar el
 * correo. Lo único que cambia es que el sistema sabe que puede escribirle a esa
 * dirección, de lo que depende que la recuperación de contraseña no sea un
 * callejón sin salida para quien se registró con un correo mal tipeado.
 */

/**
 * Canjea el token del enlace. Es público —la credencial es el token— y por eso
 * va con `publico: true`: mandar un Authorization vencido haría que el
 * interceptor intente refrescar por nada.
 *
 * **Un enlace ya usado por una cuenta ya confirmada responde 204 igual.** Es la
 * única credencial del sistema donde el segundo intento se acepta: el estado
 * final ya es el buscado, y el segundo clic lo hace quien hizo bien las cosas
 * dos veces.
 */
export function confirmarCorreo(token: string): Promise<null> {
  return http.post<null>('/auth/confirmacion/canje', { body: { token }, publico: true });
}

/**
 * Reenvía el correo a la cuenta autenticada. **Exige sesión, a diferencia del
 * canje**: un endpoint público que aceptara una dirección cualquiera sería el
 * padrón de cuentas registradas que la recuperación se cuida de no revelar.
 *
 * Responde 204 aunque no haya nada que confirmar.
 */
export function reenviarConfirmacionDeCorreo(): Promise<null> {
  return http.post<null>('/auth/confirmacion/reenvio');
}
