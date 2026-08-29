import { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';
import type { TextStyle, ViewStyle } from 'react-native';

import { duracion, SIN_DURACION } from '../theme/movimiento';

interface ColoresDeControl {
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
}

/**
 * Espejo en nativo de `--transition-control`.
 *
 * El token es una lista de transiciones CSS y no un valor escalar, así que no
 * entra al espejo de tokens (doc 09, sección 3.2): en nativo se anima cada
 * propiedad a mano con `--dur-fast` y la curva estándar, que es lo que este
 * hook hace.
 *
 * Va con timing y no con resorte porque son colores. Un resorte sobre un color
 * no existe: la interpolación es entre dos valores, no un sistema físico.
 *
 * Los valores llegan ya resueltos por el estado del componente (reposo, hover,
 * presionado, deshabilitado). Este hook no decide cuál va, solo cruza de uno al
 * siguiente sin salto.
 */
export function useTransicionDeControl({
  backgroundColor,
  borderColor,
  color,
}: ColoresDeControl): ViewStyle & TextStyle {
  const reducido = useReducedMotion();
  const cruce = reducido ? SIN_DURACION : duracion.fast;

  return useAnimatedStyle(() => {
    const estilo: ColoresDeControl = {};
    if (backgroundColor !== undefined) estilo.backgroundColor = withTiming(backgroundColor, cruce);
    if (borderColor !== undefined) estilo.borderColor = withTiming(borderColor, cruce);
    if (color !== undefined) estilo.color = withTiming(color, cruce);
    return estilo;
  }) as ViewStyle & TextStyle;
}
