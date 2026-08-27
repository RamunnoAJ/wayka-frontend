import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme';

/**
 * Port a React Native de `design-system/components/core/Skeleton.jsx`.
 *
 * Se usa con **las mismas medidas que el contenido que reemplaza**: un skeleton
 * de otro tamaño mueve el layout cuando llegan los datos.
 *
 * El shimmer del CSS es una animación de keyframes; acá es un `Animated` de
 * opacidad, que respeta el ajuste de movimiento reducido del sistema.
 */
interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  circle?: boolean;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 14, circle = false, style }: SkeletonProps) {
  const { t, px, movimientoReducido } = useTheme();
  // `useState` con inicializador perezoso y no `useRef`: el valor se crea una
  // sola vez y no se lee durante el render.
  const [pulso] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (movimientoReducido) return;
    const bucle = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    bucle.start();
    return () => bucle.stop();
  }, [pulso, movimientoReducido]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: circle ? height : width,
          height,
          borderRadius: circle ? height / 2 : px('--radius-sm'),
          backgroundColor: t['--surface-sunken'],
          opacity: movimientoReducido ? 1 : pulso,
        },
        style,
      ]}
    />
  );
}

/** Varias líneas de texto; la última sale más corta, como en un párrafo real. */
export function SkeletonText({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <View style={[estilos.columna, { gap }]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '62%' : '100%'} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({ columna: { flexDirection: 'column' } });
