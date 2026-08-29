import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePresion, useTransicionDeControl } from '../hooks';
import { useTheme } from '../theme';

import { Icon } from './Icon';

/**
 * Casilla de verificación. Port a React Native de
 * `design-system/components/core/Checkbox.jsx`, con los mismos tokens.
 *
 * Toda la fila es el área táctil: en móvil una caja de 20px sola no alcanza.
 */
interface CheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ label, description, checked, onChange, disabled }: CheckboxProps) {
  const { t, px, texto } = useTheme();
  // Se hunde la caja, no la fila: el área táctil es toda la fila, pero el
  // control que el dedo está tocando es el cuadrado de 20px.
  const presion = usePresion();
  const colores = useTransicionDeControl({
    borderColor: checked ? t['--color-primary-strong'] : t['--border-strong'],
    backgroundColor: checked ? t['--color-primary-strong'] : t['--surface-card'],
  });

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      {...presion.gestos}
      style={estilos.fila}
    >
      <Animated.View
        style={[
          {
            width: 20,
            height: 20,
            marginTop: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: px('--radius-xs'),
            borderWidth: 1,
          },
          colores,
          presion.estilo,
        ]}
      >
        {checked ? <Icon name="check" size={14} color="#fff" /> : null}
      </Animated.View>

      <View style={estilos.textos}>
        <Text style={[texto('body'), { color: t['--text-body'] }]}>{label}</Text>
        {description ? (
          <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>{description}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  textos: { gap: 2, flexShrink: 1 },
});
