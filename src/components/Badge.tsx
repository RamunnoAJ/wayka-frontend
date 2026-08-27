import { StyleSheet, Text, View } from 'react-native';

import { useTheme, type Tokens } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

/**
 * Port a React Native de `design-system/components/core/Badge.jsx`.
 *
 * Es deliberadamente sobrio: un solo fondo neutro para todos los tonos. El
 * significado lo lleva el punto de color (o el ícono) y el texto — solo
 * `danger` sube el contraste, porque es el único riesgo real.
 */
type Tono = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

function colorDelPunto(t: Tokens, tono: Tono): string {
  const puntos: Record<Tono, string> = {
    neutral: t['--neutral-400'],
    primary: t['--color-primary-strong'],
    success: t['--success-500'],
    warning: t['--warning-500'],
    danger: t['--danger-500'],
    info: t['--info-500'],
  };
  return puntos[tono];
}

interface BadgeProps {
  children: string;
  tone?: Tono;
  icon?: NombreDeIcono;
  size?: 'sm' | 'md';
}

export function Badge({ children, tone = 'neutral', icon, size = 'md' }: BadgeProps) {
  const { t, px, texto } = useTheme();
  const punto = colorDelPunto(t, tone);
  const chico = size === 'sm';

  return (
    <View
      style={[
        estilos.base,
        {
          paddingVertical: chico ? 2 : 4,
          paddingHorizontal: chico ? 8 : 10,
          borderRadius: px('--radius-pill'),
          backgroundColor: t['--surface-sunken'],
          borderColor: t['--border-subtle'],
        },
      ]}
    >
      {icon ? (
        <Icon name={icon} size={chico ? 11 : 13} color={punto} />
      ) : (
        <View style={[estilos.punto, { backgroundColor: punto }]} />
      )}
      <Text
        style={[
          texto(chico ? 'overline' : 'caption'),
          {
            fontWeight: '600',
            color: tone === 'danger' ? t['--text-danger'] : t['--text-muted'],
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  punto: { width: 6, height: 6, borderRadius: 3, flexGrow: 0, flexShrink: 0 },
});
