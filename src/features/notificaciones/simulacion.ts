import * as Notifications from 'expo-notifications';

import { esWeb } from '../../lib/plataforma';

/**
 * Avisos de prueba, solo para desarrollo.
 *
 * Un push real sale del backend (`internal/notificaciones/expo.go`) cuando un
 * barrido encuentra una cita en la ventana de aviso: para verlo hay que tener
 * una cita a la hora justa. Esto programa el **mismo texto** como notificación
 * local, que el sistema operativo dibuja igual que la que llega por la red —
 * es la forma de mirar cómo se ve un aviso sin fabricar una cita.
 *
 * Lo local y lo real se separan en un solo punto: quién manda el mensaje. Del
 * banner para adelante son indistinguibles, así que sirve para revisar el
 * copy, el ícono y el color del aviso; no para probar el registro del
 * dispositivo ni el despacho del backend.
 *
 * `__DEV__` es false en cualquier build de release, así que este módulo no
 * tiene llamadores fuera de desarrollo. Se deja igual detrás de la bandera en
 * la UI para que no dependa de que alguien se acuerde.
 */

export const PUEDE_SIMULAR = __DEV__ && !esWeb;

/** Los segundos que dan tiempo a mandar la app al fondo y ver el banner. */
export const DEMORA_DE_SIMULACION = 5;

export type AvisoSimulado = 'dia-anterior' | 'mismo-dia';

/**
 * El texto que arma el backend en `textoDelRecordatorio`. Está duplicado a
 * propósito y no importado de ningún lado: acá no hay forma de compartirlo con
 * Go, y una copia que se desactualice solo afecta a un botón de desarrollo.
 */
function texto(aviso: AvisoSimulado, paciente: string) {
  const cuando = aviso === 'mismo-dia' ? 'Hoy' : 'Mañana';
  return {
    title: 'Recordatorio de turno',
    body: `${cuando} ${paciente} tiene turno en la veterinaria.`,
  };
}

/**
 * Programa un aviso de prueba dentro de unos segundos.
 *
 * Con demora y no inmediato porque el caso que interesa mirar es el de la app
 * cerrada: con la app en primer plano, lo que se ve es lo que decide
 * `configurarPresentacionDeAvisos`, que no es como lo ve el tutor.
 */
export async function simularAviso(aviso: AvisoSimulado, paciente = 'Mora'): Promise<void> {
  if (!PUEDE_SIMULAR) return;

  await Notifications.scheduleNotificationAsync({
    content: { ...texto(aviso, paciente), sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: DEMORA_DE_SIMULACION,
    },
  });
}
