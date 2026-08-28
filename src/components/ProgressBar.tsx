import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useTheme, type Tokens } from '../theme';

/**
 * Port a React Native de `design-system/components/core/ProgressBar.jsx`.
 *
 * Dentro de una subida va **adentro de `UploadItem`**, nunca suelta.
 *
 * La variante indeterminada es un keyframe en CSS (`wayka-indeterminate`) y acá
 * un `Animated` de `translateX`: el keyframe corre una barra del 40 % desde
 * `-100%` hasta `250%` de su propio ancho, así que hay que medir la pista para
 * traducir esos porcentajes a puntos — `translateX` en RN no acepta strings.
 *
 * Con movimiento reducido no se anima y la barra queda quieta a la izquierda,
 * mismo criterio que `Skeleton`: el estado "en curso" ya lo dice el texto del
 * ítem, y una animación infinita es justamente lo que ese ajuste desactiva.
 */
type Tamano = 'sm' | 'md';
type Tono = 'primary' | 'success' | 'danger';

const ALTURAS: Record<Tamano, number> = { sm: 4, md: 6 };

const TONOS: Record<Tono, keyof Tokens> = {
  primary: '--color-primary-fill',
  success: '--success-500',
  danger: '--danger-500',
};

/** Proporción del ancho de la pista que ocupa la barra que recorre. */
const PROPORCION_INDETERMINADA = 0.4;

interface ProgressBarProps {
  /** 0-100. Ignorado si `indeterminate`. */
  value?: number;
  /** Sin porcentaje conocido: barra que recorre. Para subidas de menos de ~1 s. */
  indeterminate?: boolean;
  size?: Tamano;
  tone?: Tono;
  /**
   * Texto sobre la barra, a la izquierda. El design system admite cualquier
   * nodo; acá es texto, que es para lo único que se usa.
   */
  label?: string;
  /** Porcentaje a la derecha. No se muestra si `indeterminate`. */
  showValue?: boolean;
}

export function ProgressBar({
  value = 0,
  indeterminate = false,
  size = 'md',
  tone = 'primary',
  label,
  showValue = false,
}: ProgressBarProps) {
  const { t, px, texto, movimientoReducido } = useTheme();
  const [anchoPista, setAnchoPista] = useState(0);
  const [recorrido] = useState(() => new Animated.Value(0));

  const alto = ALTURAS[size];
  const relleno = t[TONOS[tone]];
  const pct = Math.max(0, Math.min(100, value));
  const anima = indeterminate && !movimientoReducido && anchoPista > 0;

  useEffect(() => {
    if (!anima) return;
    recorrido.setValue(0);
    const bucle = Animated.loop(
      Animated.timing(recorrido, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bezier(0.2, 0.7, 0.3, 1),
        useNativeDriver: true,
      }),
    );
    bucle.start();
    return () => bucle.stop();
  }, [anima, recorrido]);

  const anchoBarra = anchoPista * PROPORCION_INDETERMINADA;

  return (
    <View style={estilos.raiz}>
      {(label || showValue) && (
        <View style={estilos.encabezado}>
          {label ? (
            <Text style={[texto('caption'), { color: t['--text-muted'] }]}>{label}</Text>
          ) : null}
          {showValue && !indeterminate ? (
            <Text style={[texto('caption'), estilos.numero, { color: t['--text-muted'] }]}>
              {Math.round(pct)}%
            </Text>
          ) : null}
        </View>
      )}

      <View
        accessibilityRole="progressbar"
        accessibilityValue={
          indeterminate ? { text: 'En curso' } : { min: 0, max: 100, now: Math.round(pct) }
        }
        onLayout={(e) => setAnchoPista(e.nativeEvent.layout.width)}
        style={[
          estilos.pista,
          {
            height: alto,
            borderRadius: px('--radius-pill'),
            backgroundColor: t['--neutral-100'],
          },
        ]}
      >
        {indeterminate ? (
          <Animated.View
            style={[
              estilos.barraQueRecorre,
              {
                width: anchoBarra,
                borderRadius: px('--radius-pill'),
                backgroundColor: relleno,
                transform: [
                  {
                    translateX: recorrido.interpolate({
                      inputRange: [0, 1],
                      // -100% y 250% del ancho de la propia barra, como el keyframe.
                      outputRange: [-anchoBarra, anchoBarra * 2.5],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : (
          <View
            style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: px('--radius-pill'),
              backgroundColor: relleno,
            }}
          />
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { width: '100%', gap: 6 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  numero: { fontVariant: ['tabular-nums'] },
  pista: { width: '100%', overflow: 'hidden' },
  barraQueRecorre: { position: 'absolute', top: 0, bottom: 0, left: 0 },
});
