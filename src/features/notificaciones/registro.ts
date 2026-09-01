import { EVENTO_DE_USO } from '../../api/telemetria';
import {
  eliminarDispositivo,
  registrarDispositivo,
  type PlataformaDeDispositivo,
} from '../../api/dispositivo';
import {
  guardarDispositivoRegistrado,
  guardarPreferenciaDeAvisos,
  leerDispositivoRegistrado,
  leerPreferenciaDeAvisos,
} from '../../lib/almacenamiento-avisos';
import { emitir } from '../../lib/telemetria';

import {
  HAY_PUSH,
  leerEstadoDelPermiso,
  obtenerTokenDePush,
  plataformaDelDispositivo,
} from './push';

/**
 * Alta y baja del teléfono en la cuenta: la app lo registra al iniciar sesión y
 * lo da de baja al cerrarla (Alcance de Plataformas, 5.5), y el tutor puede
 * apagarlos y prenderlos a mano desde la pantalla de avisos.
 *
 * **Ningún fallo de acá corta el login ni el logout.** Quedarse sin avisos es
 * molesto; no poder entrar porque el servicio de push no contestó es peor. Todo
 * lo que puede salir mal termina en un `null` o en un `return`, nunca en una
 * excepción que suba. El interruptor de la pantalla es la excepción: ahí el
 * fallo **sí** se propaga, porque el tutor está mirando el control que acaba de
 * tocar y tiene que ver que no se aplicó.
 */

/**
 * Id del dispositivo registrado, con copia en disco.
 *
 * En memoria porque es lo que se usa en el 99% de los casos, y en disco porque
 * el id no se puede volver a averiguar: el contrato no lista dispositivos y el
 * token de push no vuelve en ninguna respuesta. Sin la copia, apagar los avisos
 * después de reiniciar la app no tendría a quién dar de baja.
 */
let registradoEnEstaSesion: string | null = null;

async function idDelDispositivo(): Promise<string | null> {
  return registradoEnEstaSesion ?? (await leerDispositivoRegistrado());
}

async function recordarDispositivo(id: string | null): Promise<void> {
  registradoEnEstaSesion = id;
  await guardarDispositivoRegistrado(id);
}

/**
 * Da de alta este teléfono. Devuelve el id, o `null` si no se pudo.
 *
 * No mira la preferencia ni el permiso: eso lo deciden sus dos llamadores, que
 * llegan acá por caminos distintos.
 */
async function darDeAlta(): Promise<string | null> {
  const token = await obtenerTokenDePush();
  if (!token) return null;

  const dispositivo = await registrarDispositivo({
    token_push: token,
    plataforma: plataformaDelDispositivo() satisfies PlataformaDeDispositivo,
  });
  await recordarDispositivo(dispositivo.id);
  return dispositivo.id;
}

/**
 * Registra el teléfono al iniciar sesión, si corresponde.
 *
 * **No dispara el prompt del sistema.** Pedirlo acá sería pedirlo en el
 * arranque, que es el momento en que menos se entiende: el permiso se pide
 * desde la pantalla de avisos, donde el usuario ya sabe para qué es.
 *
 * **Respeta el interruptor.** Sin esta comprobación, el tutor que apagó los
 * avisos los tendría de vuelta en el próximo login y el control no serviría
 * para nada.
 */
export async function registrarEsteDispositivo(): Promise<void> {
  if (!HAY_PUSH) return;
  if ((await leerEstadoDelPermiso()) !== 'concedido') return;
  if (!(await leerPreferenciaDeAvisos())) return;

  try {
    await darDeAlta();
  } catch {
    // El backend rechazó el registro o no hubo red. La sesión sigue.
  }
}

/**
 * Da de baja el teléfono de la cuenta que está cerrando sesión.
 *
 * Es lo que evita que el próximo aviso de esa cuenta llegue a un teléfono donde
 * ya entró otra persona. **No toca la preferencia**: cerrar sesión no es apagar
 * los avisos, y al volver a entrar tienen que estar como el tutor los dejó.
 */
export async function darDeBajaEsteDispositivo(): Promise<void> {
  const id = await idDelDispositivo();
  await recordarDispositivo(null);
  if (!id) return;

  try {
    await eliminarDispositivo(id);
  } catch {
    // Sin red no se puede revocar la entrega. El backend igual reasigna el token
    // a la cuenta siguiente que lo registre desde este mismo aparato.
  }
}

/** Si este teléfono tiene que recibir avisos, según lo que decidió el tutor. */
export async function avisosActivados(): Promise<boolean> {
  if (!HAY_PUSH) return false;
  return leerPreferenciaDeAvisos();
}

/**
 * Prende los avisos en este teléfono: lo recuerda y lo da de alta.
 *
 * Un fallo del alta **se propaga**, y es a propósito: acá el tutor está mirando
 * el interruptor que acaba de mover, y dejarlo en "prendido" cuando el backend
 * no registró nada le promete avisos que no van a llegar.
 */
export async function activarAvisos(): Promise<void> {
  await guardarPreferenciaDeAvisos(true);
  await darDeAlta();
}

/**
 * Apaga los avisos en este teléfono.
 *
 * La preferencia se guarda **antes** de llamar al backend: si la baja falla, lo
 * que el tutor pidió queda registrado igual y el próximo login no vuelve a dar
 * de alta el aparato. Que el registro viejo siga vivo un rato es el mal menor
 * frente a un interruptor que se prende solo.
 */
export async function desactivarAvisos(): Promise<void> {
  await guardarPreferenciaDeAvisos(false);
  // El mejor aviso temprano de fatiga: quien apaga los avisos no se fue todavía,
  // pero se fue del único canal que lo traía de vuelta (Telemetría de Producto, 5.3).
  emitir(EVENTO_DE_USO.NOTIFICACIONES_DESACTIVADAS);

  const id = await idDelDispositivo();
  await recordarDispositivo(null);
  if (!id) return;

  await eliminarDispositivo(id);
}

/** Solo para las pruebas: el módulo guarda estado de sesión. */
export function olvidarRegistro(): void {
  registradoEnEstaSesion = null;
}
