import { useState, type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePresion, useTransicionDeControl } from '../hooks';
import { ESCALA_DE_PRESION_LG, useTheme } from '../theme';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

/**
 * Superficie que responde al dedo: una tarjeta de paciente, una fila de la
 * agenda, un turno de la grilla.
 *
 * Existe para que el movimiento no se escriba una vez por pantalla. Las filas y
 * las tarjetas de la app son todas el mismo gesto —se hunden con `resorte.snap`
 * y su fondo cruza con timing—, y repetirlo en cada listado garantizaba que
 * tarde o temprano dos se movieran distinto.
 *
 * No reemplaza a `Button` ni a `IconButton`: esto es una superficie de
 * contenido que además se puede tocar, no un control con variantes y tonos.
 */
interface PresionableProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /**
   * Escala del hundido. Por defecto la de elementos grandes, que es lo que
   * suele envolver; en un control chico va `ESCALA_DE_PRESION`.
   */
  escala?: number;
  /** Fondo en reposo. */
  fondo?: string;
  /**
   * Fondo con el puntero encima o el dedo abajo. Por defecto `--surface-hover`,
   * que es lo que el sistema manda para filas y superficies: sin un valor acá,
   * la superficie se quedaba sin ninguna señal de hover.
   */
  fondoDestacado?: string;
  borde?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: 'button' | 'link';
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean; expanded?: boolean };
}

export function Presionable({
  children,
  onPress,
  disabled,
  escala = ESCALA_DE_PRESION_LG,
  fondo,
  fondoDestacado,
  borde,
  style,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
}: PresionableProps) {
  const { t } = useTheme();
  const [activo, setActivo] = useState(false);
  const presion = usePresion(escala);

  // «Hover: cambio de fondo, no de opacidad — las filas y botones fantasma pasan
  // a --surface-hover» (design system, Estados). El destacado es el del sistema
  // salvo que la pantalla pida otro: una superficie sobre fondo tintado o
  // seleccionada sí tiene que decir el suyo.
  const destacado = fondoDestacado ?? t['--surface-hover'];

  const colores = useTransicionDeControl({
    backgroundColor: activo ? destacado : fondo,
    borderColor: borde,
  });

  return (
    <PressableAnimado
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{
        ...accessibilityState,
        disabled: disabled ?? accessibilityState?.disabled,
      }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setActivo(true)}
      onHoverOut={() => setActivo(false)}
      onPressIn={() => {
        setActivo(true);
        presion.gestos.onPressIn();
      }}
      onPressOut={() => {
        setActivo(false);
        presion.gestos.onPressOut();
      }}
      style={[style, colores, presion.estilo]}
    >
      {children}
    </PressableAnimado>
  );
}
