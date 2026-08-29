import { Easing } from 'react-native-reanimated';

import { tokensDefault } from './tokens.generated';

/**
 * Espejo en JS de los tokens de movimiento, derivado de `tokens.generated.ts`.
 *
 * Los nombres `snap` / `default` / `gentle` y `instant` / `fast` / `normal` /
 * `slow` son los del design system a propósito, igual que los de los tokens:
 * un preset de acá se busca tal cual en `design-system/tokens/motion.css` y en
 * `design-system/MOVIMIENTO-REANIMATED.md`.
 *
 * Regla de reparto del sistema: **resorte para `transform`, timing para
 * `opacity` y color**. Un resorte sobre `opacity` es indistinguible de una
 * curva y cuesta frames; sobre color no existe.
 *
 * Ningún componente escribe un número de resorte a mano. Si un valor tiene que
 * cambiar, cambia en el design system y se regenera el espejo.
 */

const numero = (token: keyof typeof tokensDefault) => Number.parseFloat(tokensDefault[token]);

/**
 * Sin umbrales de reposo el resorte sigue resolviendo fracciones de píxel
 * después de haber llegado, y el final del gesto se siente pegajoso. Van en los
 * tres presets, no son opcionales.
 */
const reposo = {
  restDisplacementThreshold: numero('--spring-rest-displacement'),
  restSpeedThreshold: numero('--spring-rest-speed'),
} as const;

/**
 * Los tres resortes del sistema, críticamente amortiguados (damping ratio
 * ~1.0): llegan y se detienen, nunca rebotan. Solo para `transform`.
 */
export const resorte = {
  /** ~140 ms. Press de botón, card e icono, y todo lo que responde al dedo. */
  snap: {
    damping: numero('--spring-snap-damping'),
    stiffness: numero('--spring-snap-stiffness'),
    mass: numero('--spring-snap-mass'),
    ...reposo,
  },
  /** ~260 ms. Indicador de tabs, chips que aparecen, badge de contador. */
  default: {
    damping: numero('--spring-default-damping'),
    stiffness: numero('--spring-default-stiffness'),
    mass: numero('--spring-default-mass'),
    ...reposo,
  },
  /** ~380 ms. Entrada de pantalla, sheet, modal, retorno del pull to refresh. */
  gentle: {
    damping: numero('--spring-gentle-damping'),
    stiffness: numero('--spring-gentle-stiffness'),
    mass: numero('--spring-gentle-mass'),
    ...reposo,
  },
} as const;

/**
 * La curva única del sistema. `--ease-out` y `--ease-in` existen en el CSS pero
 * no se usan en nativo: el movimiento de la app entra y sale con la estándar.
 */
function curva(token: keyof typeof tokensDefault) {
  const puntos = tokensDefault[token]
    .replace(/^cubic-bezier\(|\)$/g, '')
    .split(',')
    .map((n) => Number.parseFloat(n));
  const [x1, y1, x2, y2] = puntos as [number, number, number, number];
  return Easing.bezier(x1, y1, x2, y2);
}

const estandar = curva('--ease-standard');

/** Duraciones. Solo para `opacity` y para interpolación de color. */
export const duracion = {
  /** 80 ms. Flash de cámara: cambios que no deben leerse como animación. */
  instant: { duration: numero('--dur-instant'), easing: estandar },
  /** 140 ms. Estados de control (fondo, borde, texto) y salida de toast. */
  fast: { duration: numero('--dur-fast'), easing: estandar },
  /** 220 ms. Fades de entrada y crossfade entre vistas. */
  normal: { duration: numero('--dur-normal'), easing: estandar },
  /** 340 ms. Reservado; casi no se usa en nativo. */
  slow: { duration: numero('--dur-slow'), easing: estandar },
} as const;

/** Duración cero, para el camino de movimiento reducido. */
export const SIN_DURACION = { duration: 0 } as const;

/**
 * Desplazamiento de entrada de cualquier elemento. Uno solo para todo el
 * sistema: la escala del movimiento no es una decisión por pantalla.
 */
export const DESPLAZAMIENTO = numero('--motion-offset');

/**
 * Lo que entra desde fuera del layout (toast, sheet) recorre 8 px y no 6: no
 * viene de su propio sitio, viene del borde de la pantalla.
 */
export const DESPLAZAMIENTO_EXTERNO = 8;

/** Escala del press en botones, iconos y controles chicos. */
export const ESCALA_DE_PRESION = numero('--motion-press-scale');

/**
 * Escala del press en cards grandes y filas de lista. El mismo factor se lee
 * más fuerte cuanto más grande es el elemento, así que ahí se achica.
 */
export const ESCALA_DE_PRESION_LG = numero('--motion-press-scale-lg');

/** Escalón entre dos bloques de una misma pantalla. Nunca más de dos. */
export const ESCALON_MS = 40;
