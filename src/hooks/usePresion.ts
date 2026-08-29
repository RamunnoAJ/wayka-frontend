import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  type AnimatedStyle,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

import { ESCALA_DE_PRESION, resorte } from '../theme/movimiento';

interface Presion {
  /** Va en el `style` del componente animado, después de los estilos fijos. */
  estilo: AnimatedStyle<ViewStyle>;
  /** Se derrama sobre el `Pressable`: `<Pressable {...presion.gestos}>`. */
  gestos: { onPressIn: () => void; onPressOut: () => void };
}

/**
 * Feedback táctil del sistema: el elemento se hunde mientras el dedo está
 * abajo y vuelve con la misma física.
 *
 * Es escala y **nunca opacidad**. Apagar un control mientras se lo toca lo hace
 * parecer deshabilitado, que es justo lo contrario de lo que está pasando.
 *
 * El color de fondo no se toca acá: lo sigue manejando el estado del componente
 * con `withTiming`, según la regla de reparto del sistema.
 *
 * @param escala Destino del hundido. `ESCALA_DE_PRESION_LG` en cards grandes y
 *   filas de lista, donde el mismo factor se lee más fuerte.
 */
export function usePresion(escala: number = ESCALA_DE_PRESION): Presion {
  const reducido = useReducedMotion();
  const valor = useSharedValue(1);

  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: valor.get() }] }));

  return {
    estilo,
    gestos: {
      onPressIn: () => {
        if (!reducido) valor.set(withSpring(escala, resorte.snap));
      },
      onPressOut: () => {
        if (!reducido) valor.set(withSpring(1, resorte.snap));
      },
    },
  };
}
