import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

/**
 * Port a React Native de `design-system/components/core/Avatar.jsx`.
 *
 * Con `species` el recorte es redondeado (no circular) y muestra el ícono de la
 * especie; sin especie, las iniciales del nombre.
 */
const MEDIDAS = { sm: 32, md: 40, lg: 56, xl: 80 } as const;

type Tamano = keyof typeof MEDIDAS;

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: Tamano;
  /** Texto libre en el contrato: `canino`, `felino`, o cualquier otra especie. */
  species?: string;
  tone?: 'accent' | 'brand';
}

function iconoDeEspecie(especie: string): NombreDeIcono {
  const normalizada = especie.trim().toLowerCase();
  if (normalizada === 'felino') return 'cat';
  if (normalizada === 'canino') return 'dog';
  return 'paw-print';
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ name = '', src, size = 'md', species, tone = 'accent' }: AvatarProps) {
  const { t, px, texto } = useTheme();
  const d = MEDIDAS[size];
  const esMarca = tone === 'brand';

  return (
    <View
      style={[
        estilos.base,
        {
          width: d,
          height: d,
          borderRadius: species ? px('--radius-md') : d / 2,
          backgroundColor: esMarca ? t['--color-accent-soft'] : t['--color-primary-soft'],
        },
      ]}
    >
      {src ? (
        <Image source={{ uri: src }} accessibilityLabel={name} style={estilos.imagen} />
      ) : species ? (
        <Icon
          name={iconoDeEspecie(species)}
          size={Math.round(d * 0.5)}
          color={esMarca ? t['--color-accent-strong'] : t['--color-primary-strong']}
        />
      ) : (
        <Text
          style={[
            texto('body-strong'),
            {
              fontSize: Math.round(d * 0.36),
              lineHeight: Math.round(d * 0.36),
              color: esMarca ? t['--color-accent-strong'] : t['--color-primary-strong'],
            },
          ]}
        >
          {iniciales(name)}
        </Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagen: { width: '100%', height: '100%' },
});
