import * as Notifications from 'expo-notifications';

import { EVENTO_DE_USO } from '../../api/telemetria';
import { emitir } from '../../lib/telemetria';

import { HAY_PUSH } from './push';

/**
 * Deja registrado que la app se abrió tocando un aviso.
 *
 * Es el numerador de la tasa de apertura del push, cuyo denominador lo emite el
 * backend al despachar. Y es lo que separa las dos lecturas de la retención del
 * tutor: la que entra sola y la que entra porque le avisaron son dos historias
 * distintas sobre el mismo número (Telemetría de Producto, 5.3).
 *
 * **Sin el tipo del aviso todavía.** El mensaje que manda el backend lleva título
 * y cuerpo, no un `data` con el tipo, así que acá no hay con qué distinguir el
 * recordatorio del día anterior del de la misma mañana. Se emite igual: la tasa
 * de apertura se lee entera, y el corte por tipo espera a que el push lo traiga.
 */
export function escucharAperturaDesdeAviso(): () => void {
  if (!HAY_PUSH) return () => {};

  const suscripcion = Notifications.addNotificationResponseReceivedListener(() => {
    emitir(EVENTO_DE_USO.APP_ABIERTA_DESDE_PUSH);
  });
  return () => suscripcion.remove();
}
