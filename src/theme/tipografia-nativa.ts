import { Platform } from 'react-native';

/**
 * Mapeo de peso (`--fw-*`) a familia de fuente en nativo.
 *
 * En nativo cada peso de Satoshi es una familia distinta, no un `fontWeight`
 * numérico sobre una sola familia. Y **no existe un estático 600 (SemiBold)**:
 * la decisión tomada es mapear 600 → 700 (Bold) con los estáticos, en vez de
 * cargar la variable y depender de interpolación de peso (doc 09, sección 5).
 *
 * Ese mapeo vive acá y en ningún otro lado: un componente pide
 * `familiaPara(t['--fw-semibold'])`, no decide por su cuenta.
 */

/** Nombre con el que se carga cada archivo en `expo-font`. */
export const FUENTES_NATIVAS = {
  'Satoshi-Light': require('../../design-system/assets/fonts/native/Satoshi-Light.otf'),
  'Satoshi-Regular': require('../../design-system/assets/fonts/native/Satoshi-Regular.otf'),
  'Satoshi-Medium': require('../../design-system/assets/fonts/native/Satoshi-Medium.otf'),
  'Satoshi-Bold': require('../../design-system/assets/fonts/native/Satoshi-Bold.otf'),
  'Satoshi-Black': require('../../design-system/assets/fonts/native/Satoshi-Black.otf'),
  'Satoshi-Italic': require('../../design-system/assets/fonts/native/Satoshi-Italic.otf'),
  'Satoshi-BoldItalic': require('../../design-system/assets/fonts/native/Satoshi-BoldItalic.otf'),
} as const;

const FAMILIA_POR_PESO: Record<string, string> = {
  '300': 'Satoshi-Light',
  '400': 'Satoshi-Regular',
  '500': 'Satoshi-Medium',
  // 600 no existe como estático: se resuelve con Bold, decisión de doc 09 §5.
  '600': 'Satoshi-Bold',
  '700': 'Satoshi-Bold',
  '900': 'Satoshi-Black',
};

interface EstiloDeFuente {
  fontFamily: string;
  fontWeight?: '300' | '400' | '500' | '600' | '700' | '900';
}

/**
 * Traduce el valor de un token `--fw-*` al estilo de fuente de la plataforma.
 *
 * En web se devuelve la familia del CSS con el peso numérico intacto: ahí la
 * fuente variable interpola el 600 real y no hay motivo para degradarlo.
 */
export function familiaPara(peso: string, fontSans: string): EstiloDeFuente {
  if (Platform.OS === 'web') {
    return { fontFamily: fontSans, fontWeight: peso as EstiloDeFuente['fontWeight'] };
  }
  return { fontFamily: FAMILIA_POR_PESO[peso] ?? 'Satoshi-Regular' };
}
