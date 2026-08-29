import { useState } from 'react';
import { Pressable, type ViewStyle } from 'react-native';

import { ANCHO_BORDE_FOCO, colorDeFoco, useTheme } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

/**
 * Port a React Native de `design-system/components/core/IconButton.jsx`.
 *
 * `label` es obligatorio: un botón que es solo un glifo no se lee con un
 * lector de pantalla si nadie le pone nombre.
 */
const MEDIDAS = { sm: 32, md: 40, lg: 48 } as const;

type Tamano = keyof typeof MEDIDAS;
type Variante = 'ghost' | 'solid' | 'outline' | 'on-dark';

interface IconButtonProps {
  icon: NombreDeIcono;
  label: string;
  size?: Tamano;
  variant?: Variante;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  disabled,
  onPress,
  style,
}: IconButtonProps) {
  const { t, px } = useTheme();
  const [sobrevolado, setSobrevolado] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const d = MEDIDAS[size];
  const sobreOscuro = variant === 'on-dark';

  const fondo = (() => {
    if (variant === 'solid') {
      return sobrevolado ? t['--color-primary-fill-hover'] : t['--color-primary-fill'];
    }
    if (sobreOscuro) return sobrevolado ? t['--surface-nav-item'] : 'transparent';
    return sobrevolado && !disabled ? t['--surface-hover'] : 'transparent';
  })();

  const color = (() => {
    if (variant === 'solid') return t['--color-primary-fill-fg'];
    if (sobreOscuro) return t['--text-on-nav'];
    return disabled ? t['--text-subtle'] : t['--text-muted'];
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setSobrevolado(true)}
      onHoverOut={() => setSobrevolado(false)}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      style={[
        {
          width: d,
          height: d,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: px('--radius-control'),
          backgroundColor: fondo,
          borderWidth: enfocado ? ANCHO_BORDE_FOCO : 1,
          borderColor: enfocado
            ? colorDeFoco(t['--border-focus'], sobreOscuro)
            : variant === 'outline'
              ? t['--border-default']
              : 'transparent',
        },
        style,
      ]}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 20} color={color} />
    </Pressable>
  );
}
