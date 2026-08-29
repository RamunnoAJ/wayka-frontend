import { useState } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { usePresion, useTransicionDeControl } from '../hooks';
import { ANCHO_BORDE_FOCO, useTheme } from '../theme';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

/**
 * Port a React Native de `design-system/components/core/SocialButton.jsx`.
 *
 * Autenticación con Google. Solo móvil, tema tutor, en login y registro
 * (Alcance de Plataformas, 5.1).
 *
 * **Los hexadecimales de acá abajo son la excepción declarada** a la regla de
 * que ningún componente escribe un color literal (`tokenExceptions` en
 * `design-system/version.json`): son la cromía de Google, marca ajena con guía
 * propia. No son tokens, no son themeables y **no cambian con el tema** — el
 * botón se ve igual en el tema tutor que en el de clínica. Lo único que hereda
 * del sistema es el radio, la tipografía y la altura táctil.
 */
const GOOGLE = {
  fondo: '#FFFFFF',
  borde: '#DADCE0',
  texto: '#3C4043',
  azul: '#4285F4',
  verde: '#34A853',
  amarillo: '#FBBC05',
  rojo: '#EA4335',
} as const;

const ALTURAS = { md: 44, touch: 52 } as const;

/** Logo de Google: se usa tal cual, sin teñir, sin recortar y sin meterlo en un círculo. */
function LogoDeGoogle({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill={GOOGLE.azul}
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.09c4.15-3.82 6.58-9.45 6.58-16.17z"
      />
      <Path
        fill={GOOGLE.verde}
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.09-5.52c-1.97 1.32-4.49 2.1-7.47 2.1-5.74 0-10.6-3.88-12.34-9.09H4.34v5.71C7.96 41.07 15.4 46 24 46z"
      />
      <Path
        fill={GOOGLE.amarillo}
        d="M11.66 28.16c-.44-1.32-.69-2.73-.69-4.16s.25-2.84.69-4.16v-5.71H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.87l7.32-5.71z"
      />
      <Path
        fill={GOOGLE.rojo}
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.29-6.29C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.13l7.32 5.71z"
      />
    </Svg>
  );
}

interface SocialButtonProps {
  /** Único proveedor del alcance. */
  provider?: 'google';
  /** Cambia solo la etiqueta. */
  mode?: 'login' | 'signup';
  size?: keyof typeof ALTURAS;
  block?: boolean;
  /** Reemplaza la etiqueta. No cambiar el nombre "Google". */
  label?: string;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function SocialButton({
  mode = 'login',
  size = 'touch',
  block = true,
  label,
  disabled = false,
  onPress,
  style,
}: SocialButtonProps) {
  const { px, texto } = useTheme();
  const [enfocado, setEnfocado] = useState(false);
  const presion = usePresion();
  // El anillo de foco tampoco se tiñe con el tema: sobre una superficie ajena,
  // el borde de la propia guía es el que mantiene el contraste.
  const colores = useTransicionDeControl({ borderColor: enfocado ? GOOGLE.texto : GOOGLE.borde });

  const etiqueta = label ?? (mode === 'signup' ? 'Registrarme con Google' : 'Continuar con Google');

  return (
    <PressableAnimado
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      {...presion.gestos}
      style={[
        estilos.base,
        {
          width: block ? '100%' : undefined,
          alignSelf: block ? 'stretch' : 'flex-start',
          height: ALTURAS[size],
          borderRadius: px('--radius-md'),
          backgroundColor: GOOGLE.fondo,
          borderWidth: enfocado ? ANCHO_BORDE_FOCO : 1,
          // La opacidad de acá es el estado deshabilitado, no un feedback de
          // toque: el press del sistema es escala y nunca opacidad.
          opacity: disabled ? 0.5 : 1,
        },
        colores,
        presion.estilo,
        style,
      ]}
    >
      <LogoDeGoogle size={18} />
      <Text numberOfLines={1} style={[texto('body'), estilos.etiqueta, { color: GOOGLE.texto }]}>
        {etiqueta}
      </Text>
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  etiqueta: { fontWeight: '500' },
});
