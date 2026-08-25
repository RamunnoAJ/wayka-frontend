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
  overline: { fw: '--fw-medium', fs: '--fs-overline', lh: '--lh-normal', ls: '--ls-overline' },
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
