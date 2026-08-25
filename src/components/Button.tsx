import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { ANCHO_BORDE_FOCO, colorDeFoco, useTheme, type Tokens } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

/**
 * Botón de acción. Port a React Native de `design-system/components/core/Button.jsx`
 * — mismos tokens, misma API pública (`variant`, `size`, `block`, `loading`).
 *
 * Regla del design system que el código no puede aplicar solo: **una sola
 * acción primaria por pantalla**.
 *
 * `variant="accent"` está deprecado en el design system (alias de `primary`) y
 * no se replica acá: en código nuevo no debería usarse.
 */
type Variante = 'primary' | 'secondary' | 'ghost' | 'danger';
type Tamano = 'sm' | 'md' | 'lg' | 'touch';

interface Tono {
  bg: string;
  fg: string;
  border: string;
  hover: string;
}

function tonos(t: Tokens): Record<Variante, Tono> {
  return {
    // El primario claro no llega a AA con texto blanco: lo que se pinta lleno
    // usa --color-primary-fill, nunca --color-primary (BRIEF, sección 3).
    primary: {
      bg: t['--color-primary-fill'],
      fg: '#fff',
      border: 'transparent',
      hover: t['--color-primary-fill-hover'],
    },
    secondary: {
      bg: t['--surface-card'],
      fg: t['--text-strong'],
      border: t['--border-default'],
      hover: t['--surface-hover'],
    },
    ghost: {
      bg: 'transparent',
      fg: t['--color-primary-strong'],
      border: 'transparent',
      hover: t['--color-primary-soft'],
    },
    danger: { bg: t['--danger-500'], fg: '#fff', border: 'transparent', hover: t['--danger-600'] },
  };
}

const MEDIDAS: Record<
  Tamano,
  { alto: keyof Tokens; px: number; fs: keyof Tokens; gap: number; icono: number }
> = {
  sm: { alto: '--control-h-sm', px: 12, fs: '--fs-body-sm', gap: 6, icono: 16 },
  md: { alto: '--control-h-md', px: 16, fs: '--fs-body', gap: 8, icono: 18 },
  lg: { alto: '--control-h-lg', px: 22, fs: '--fs-body-lg', gap: 10, icono: 20 },
  touch: { alto: '--control-h-touch', px: 24, fs: '--fs-body-lg', gap: 10, icono: 20 },
};

interface ButtonProps {
  children: string;
  variant?: Variante;
  size?: Tamano;
  iconLeft?: NombreDeIcono;
  iconRight?: NombreDeIcono;
  block?: boolean;
  disabled?: boolean;
  /** Muestra el spinner y deshabilita: una acción en curso no se dispara dos veces. */
  loading?: boolean;
  /** `true` si el botón está sobre `--surface-nav` u otra superficie oscura. */
  sobreOscuro?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  block,
  disabled,
  loading,
  sobreOscuro,
  onPress,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { t, px, texto } = useTheme();
  const [enfocado, setEnfocado] = useState(false);
  const [sobrevolado, setSobrevolado] = useState(false);

  const tono = tonos(t)[variant];
  const medida = MEDIDAS[size];
  const inhabilitado = Boolean(disabled || loading);

  const colorTexto = inhabilitado ? t['--text-subtle'] : tono.fg;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inhabilitado, busy: loading }}
      disabled={inhabilitado}
      onPress={onPress}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      onHoverIn={() => setSobrevolado(true)}
      onHoverOut={() => setSobrevolado(false)}
      style={({ pressed }) => [
        estilos.base,
        {
          width: block ? '100%' : undefined,
          alignSelf: block ? 'stretch' : 'flex-start',
          gap: medida.gap,
          height: px(medida.alto),
          paddingHorizontal: medida.px,
          borderRadius: px('--radius-control'),
          backgroundColor: inhabilitado
            ? t['--surface-disabled']
            : pressed || sobrevolado
              ? tono.hover
              : tono.bg,
          borderWidth: enfocado ? ANCHO_BORDE_FOCO : 1,
          borderColor: enfocado
            ? colorDeFoco(
                variant === 'danger' ? t['--border-danger'] : t['--border-focus'],
                sobreOscuro,
              )
            : tono.border === 'transparent'
              ? 'transparent'
              : tono.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colorTexto} />
      ) : (
        iconLeft && <Icon name={iconLeft} size={medida.icono} color={colorTexto} />
      )}
      <Text
        numberOfLines={1}
        style={[
          texto('body-strong'),
          { fontSize: Number.parseFloat(t[medida.fs]), color: colorTexto },
        ]}
      >
        {children}
      </Text>
      {iconRight && <Icon name={iconRight} size={medida.icono} color={colorTexto} />}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
