/// <reference types="expo/types" />

/**
 * Declaraciones de módulos no-TS que el bundler resuelve.
 *
 * No va en `expo-env.d.ts`: ese archivo lo genera y lo pisa Expo.
 */

// Los SVG se importan como componentes de React (ver metro.config.js).
declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';

  const contenido: FC<SvgProps>;
  export default contenido;
}
