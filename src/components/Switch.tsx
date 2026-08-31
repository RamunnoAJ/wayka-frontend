import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTransicionDeControl } from '../hooks';
import { resorte, sombra, useTheme } from '../theme';

/**
 * Interruptor. Port a React Native de `design-system/components/core/Switch.jsx`,
 * con los mismos tokens y las mismas medidas.
 *
 * **Se aplica solo**: a diferencia de un formulario, acá no hay un botón de
 * guardar. Lo usa quien lo toca esperando que el efecto sea inmediato, así que
 * quien lo consume tiene que hacer el cambio en el momento y volver atrás el
 * estado si falla.
 *
 * Toda la fila es el área táctil, como en `Checkbox`: la pastilla sola son
 * 42×24 px y en un teléfono eso no alcanza.
 */
const ANCHO_DE_LA_PASTILLA = 42;
const ALTO_DE_LA_PASTILLA = 24;
const LADO_DEL_PULGAR = 20;
const MARGEN = 2;

/** Lo que recorre el pulgar de apagado a encendido. */
const RECORRIDO = ANCHO_DE_LA_PASTILLA - LADO_DEL_PULGAR - MARGEN * 2;

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
  disabled?: boolean;
}

export function Switch({ label, description, checked, onChange, disabled }: SwitchProps) {
  const { t, px, texto } = useTheme();
  const reducido = useReducedMotion();

  const desplazamiento = useSharedValue(checked ? RECORRIDO : 0);

  useEffect(() => {
    const destino = checked ? RECORRIDO : 0;
    desplazamiento.set(reducido ? destino : withSpring(destino, resorte.snap));
  }, [checked, desplazamiento, reducido]);

  const estiloDelPulgar = useAnimatedStyle(() => ({
    transform: [{ translateX: desplazamiento.get() }],
  }));

  // El color de la pastilla cruza con timing y el pulgar se mueve con resorte:
  // es la regla de reparto del sistema, no dos decisiones sueltas.
  const colorDeLaPastilla = useTransicionDeControl({
    backgroundColor: checked ? t['--color-primary-strong'] : t['--neutral-300'],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      accessibilityHint={description}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[estilos.fila, disabled ? estilos.apagado : null]}
    >
      <View style={estilos.textos}>
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>{label}</Text>
        {description ? (
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{description}</Text>
        ) : null}
      </View>

      <Animated.View
        style={[estilos.pastilla, colorDeLaPastilla, { borderRadius: px('--radius-pill') }]}
      >
        <Animated.View
          style={[
            estilos.pulgar,
            estiloDelPulgar,
            sombra('--shadow-xs'),
            { backgroundColor: t['--surface-card'] },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  textos: { flex: 1, gap: 2 },
  apagado: { opacity: 0.5 },
  pastilla: {
    width: ANCHO_DE_LA_PASTILLA,
    height: ALTO_DE_LA_PASTILLA,
    padding: MARGEN,
    justifyContent: 'center',
  },
  pulgar: { width: LADO_DEL_PULGAR, height: LADO_DEL_PULGAR, borderRadius: LADO_DEL_PULGAR / 2 },
});
