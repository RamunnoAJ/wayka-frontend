import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={estilos.fila}
    >
      <View
        style={{
          width: 20,
          height: 20,
          marginTop: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: px('--radius-xs'),
          borderWidth: 1,
          borderColor: checked ? t['--color-primary-strong'] : t['--border-strong'],
          backgroundColor: checked ? t['--color-primary-strong'] : t['--surface-card'],
        }}
      >
        {checked ? <Icon name="check" size={14} color="#fff" /> : null}
      </View>

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
