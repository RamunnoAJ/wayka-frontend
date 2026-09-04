import type { TextStyle } from 'react-native';

import { familiaPara } from './tipografia-nativa';
import type { Tokens } from './tokens.generated';

/**
 * Estilos de texto compuestos.
 *
 * Los `--text-*` de `typography.css` son shorthand `font` y no se parsean
 * (doc 09, sección 3.2): esta tabla los recompone desde los escalares
 * `--fw-*` / `--fs-*` / `--lh-*`, que son la fuente de verdad. Cada entrada es
 * la transcripción literal de la declaración del CSS — si cambia allá, cambia
 * acá.
 */
const COMPUESTOS = {
  'display-lg': { fw: '--fw-bold', fs: '--fs-display-lg', lh: '--lh-tight', ls: '--ls-display' },
  'display-md': { fw: '--fw-bold', fs: '--fs-display-md', lh: '--lh-tight', ls: '--ls-display' },
  h1: { fw: '--fw-bold', fs: '--fs-h1', lh: '--lh-snug', ls: '--ls-heading' },
  h2: { fw: '--fw-semibold', fs: '--fs-h2', lh: '--lh-snug', ls: '--ls-heading' },
  h3: { fw: '--fw-semibold', fs: '--fs-h3', lh: '--lh-snug', ls: '--ls-heading' },
  h4: { fw: '--fw-semibold', fs: '--fs-h4', lh: '--lh-normal', ls: '--ls-heading' },
  body: { fw: '--fw-regular', fs: '--fs-body', lh: '--lh-normal', ls: '--ls-body' },
  'body-lg': { fw: '--fw-regular', fs: '--fs-body-lg', lh: '--lh-normal', ls: '--ls-body' },
  'body-sm': { fw: '--fw-regular', fs: '--fs-body-sm', lh: '--lh-normal', ls: '--ls-body' },
  'body-strong': { fw: '--fw-semibold', fs: '--fs-body', lh: '--lh-normal', ls: '--ls-body' },
  caption: { fw: '--fw-medium', fs: '--fs-caption', lh: '--lh-normal', ls: '--ls-body' },
  // Bold, no medium: «Overline 11/700 versalita (única)» (design system,
  // §Jerarquía). El CSS entregado no define un compuesto para overline, así que
  // este se recompuso a mano y eligió mal el peso — y 16 pantallas lo venían
  // corrigiendo con un `fontWeight: '700'` al lado de cada `texto('overline')`.
  overline: { fw: '--fw-bold', fs: '--fs-overline', lh: '--lh-normal', ls: '--ls-overline' },
} as const;

export type NivelDeTexto = keyof typeof COMPUESTOS;

/** `56px` → `56`. Los tokens guardan la unidad del CSS; RN quiere el número. */
export function aNumero(valor: string): number {
  return Number.parseFloat(valor);
}

/**
 * `--ls-*` viene en `em` (`-0.02em`), y RN espera `letterSpacing` en puntos:
 * se multiplica por el tamaño de fuente.
 */
function letterSpacing(valorEm: string, fontSize: number): number {
  return Number.parseFloat(valorEm) * fontSize;
}

export function estiloDeTexto(t: Tokens, nivel: NivelDeTexto): TextStyle {
  const def = COMPUESTOS[nivel];
  const fontSize = aNumero(t[def.fs]);
  return {
    ...familiaPara(t[def.fw], t['--font-sans']),
    fontSize,
    lineHeight: fontSize * Number.parseFloat(t[def.lh]),
    letterSpacing: letterSpacing(t[def.ls], fontSize),
  };
}

/** Cuánto crece el cuerpo del texto sobre el naranja de marca. */
export const REFUERZO_SOBRE_MARCA_PX = 2;

/** Peso siguiente. En nativo 600 y 700 son la misma familia, en web no. */
const PESO_REFORZADO: Record<string, keyof Tokens> = {
  '300': '--fw-regular',
  '400': '--fw-semibold',
  '500': '--fw-semibold',
  '600': '--fw-bold',
  '700': '--fw-bold',
  '900': '--fw-black',
};

/**
 * Texto sobre el naranja de marca del tutor (`--surface-nav`,
 * `--color-primary-fill`).
 *
 * Desde la 1.5.0 del design system esa superficie se pinta con el naranja pleno
 * y contenido blanco, que da **2.0:1**. Subir cuerpo y peso es la mitigación que
 * el propio design system recomienda, y es lo que hace esta función: un cuerpo
 * más grande y el peso siguiente.
 *
 * **No alcanza AA y no pretende hacerlo.** El mínimo para texto grande es 3:1 y
 * acá el fondo no cambia, así que el ratio sigue siendo 2.0:1 — esto mejora la
 * legibilidad real, no el cumplimiento. Cumplir exigiría oscurecer el fondo, que
 * es justo lo que la marca decidió no hacer.
 *
 * En el tema de clínica devuelve el estilo sin tocar: ahí la navegación es
 * oscura y ya contrasta.
 */
export function estiloDeTextoSobreMarca(
  t: Tokens,
  nivel: NivelDeTexto,
  reforzar: boolean,
): TextStyle {
  const base = estiloDeTexto(t, nivel);
  if (!reforzar) return base;

  const def = COMPUESTOS[nivel];
  const fontSize = aNumero(t[def.fs]) + REFUERZO_SOBRE_MARCA_PX;
  const pesoBase = t[def.fw];

  return {
    ...base,
    ...familiaPara(t[PESO_REFORZADO[pesoBase] ?? def.fw], t['--font-sans']),
    fontSize,
    lineHeight: fontSize * Number.parseFloat(t[def.lh]),
    letterSpacing: letterSpacing(t[def.ls], fontSize),
  };
}
