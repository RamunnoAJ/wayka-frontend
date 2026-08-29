import { useCallback } from 'react';
import {
  useReducedMotion,
  withDelay,
  withSpring,
  withTiming,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';

import { DESPLAZAMIENTO, duracion, resorte, SIN_DURACION } from '../theme/movimiento';

/**
 * Entrada de un bloque de pantalla: aparece y sube 6 px hasta su sitio.
 *
 * Es la única animación de entrada del sistema, y se aplica al bloque entero,
 * no elemento por elemento — una lista donde cada fila entra por su cuenta se
 * lee como una pantalla que tarda, no como una que llega.
 *
 * Si la pantalla tiene encabezado y cuerpo se escalonan con `ESCALON_MS`, y
 * nunca más de dos escalones: el tercero ya es una espera.
 *
 * Con movimiento reducido queda solo el fade, sin recorrido. El estado final es
 * idéntico: se elimina el viaje, no el resultado.
 *
 * @param retraso Milisegundos antes de arrancar. `ESCALON_MS` para el cuerpo.
 */
export function useEntrada(retraso: number = 0): EntryExitAnimationFunction {
  const reducido = useReducedMotion();
  const desplazamiento = reducido ? 0 : DESPLAZAMIENTO;
  const aparicion = reducido ? SIN_DURACION : duracion.normal;

  return useCallback(() => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateY: desplazamiento }] },
      animations: {
        opacity: withDelay(retraso, withTiming(1, aparicion)),
        transform: [{ translateY: withDelay(retraso, withSpring(0, resorte.gentle)) }],
      },
    };
  }, [retraso, desplazamiento, aparicion]);
}
