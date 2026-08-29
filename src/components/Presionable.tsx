import { useState, type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePresion, useTransicionDeControl } from '../hooks';
import { ESCALA_DE_PRESION_LG } from '../theme';

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
  /** Fondo con el puntero encima o el dedo abajo. Sin esto, el fondo no cruza. */
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
  const [activo, setActivo] = useState(false);
  const presion = usePresion(escala);

  const colores = useTransicionDeControl({
    backgroundColor: activo && fondoDestacado ? fondoDestacado : fondo,
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
