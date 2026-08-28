import {
  eliminarDispositivo,
  registrarDispositivo,
  type PlataformaDeDispositivo,
} from '../../api/dispositivo';

import {
  HAY_PUSH,
  leerEstadoDelPermiso,
  obtenerTokenDePush,
  plataformaDelDispositivo,
} from './push';

/**
 * Alta y baja del teléfono en la cuenta: la app lo registra al iniciar sesión y
 * lo da de baja al cerrarla (Alcance de Plataformas, 5.5).
 *
 * **Ningún fallo de acá corta el login ni el logout.** Quedarse sin avisos es
 * molesto; no poder entrar porque el servicio de push no contestó es peor. Todo
 * lo que puede salir mal termina en un `null` o en un `return`, nunca en una
 * excepción que suba.
 */

/**
 * Id del dispositivo registrado en esta sesión, para poder darlo de baja al
 * cerrarla. Vive en memoria y no persiste: si la app se cierra sin logout, el
 * registro queda vivo en el backend — que es lo correcto, porque el teléfono
 * sigue siendo de esa cuenta hasta que otra lo reclame.
 */
let registradoEnEstaSesion: string | null = null;

/**
 * Registra el teléfono si el permiso ya está concedido.
 *
 * **No dispara el prompt del sistema.** Pedirlo acá sería pedirlo en el
 * arranque, que es el momento en que menos se entiende: el permiso se pide
 * desde la pantalla de avisos, donde el usuario ya sabe para qué es
 * (`PermissionCard`).
 */
export async function registrarEsteDispositivo(): Promise<void> {
  if (!HAY_PUSH) return;

  if ((await leerEstadoDelPermiso()) !== 'concedido') return;

  const token = await obtenerTokenDePush();
  if (!token) return;

  try {
    const dispositivo = await registrarDispositivo({
      token_push: token,
      plataforma: plataformaDelDispositivo() satisfies PlataformaDeDispositivo,
    });
    registradoEnEstaSesion = dispositivo.id;
  } catch {
    // El backend rechazó el registro o no hubo red. La sesión sigue.
  }
}

/**
 * Da de baja el teléfono de la cuenta que está cerrando sesión.
 *
 * Es lo que evita que el próximo aviso de esa cuenta llegue a un teléfono donde
 * ya entró otra persona.
 */
export async function darDeBajaEsteDispositivo(): Promise<void> {
  const id = registradoEnEstaSesion;
  registradoEnEstaSesion = null;
  if (!id) return;

  try {
    await eliminarDispositivo(id);
  } catch {
    // Sin red no se puede revocar la entrega. El backend igual reasigna el token
    // a la cuenta siguiente que lo registre desde este mismo aparato.
  }
}

/** Solo para las pruebas: el módulo guarda estado de sesión. */
export function olvidarRegistro(): void {
  registradoEnEstaSesion = null;
}
