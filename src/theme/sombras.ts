import { Platform, type ViewStyle } from 'react-native';

/**
 * Tabla fija de sombra y foco por plataforma. NO se genera del CSS: los
 * `--shadow-*` y `--ring-*` son cadenas `box-shadow`, no valores escalares
 * (doc 09, sección 3.3 — traducción entregada por Claude Design).
 */

/** Color base de todas las sombras del sistema. */
export const COLOR_SOMBRA = '#1E1428';

interface EquivalenciaSombra {
  /** Desplazamiento vertical en iOS. El horizontal es siempre 0. */
  offsetY: number;
  radius: number;
  opacity: number;
  /** `elevation` de Android. */
  elevation: number;
}

const TABLA: Record<string, EquivalenciaSombra> = {
  '--shadow-xs': { offsetY: 1, radius: 2, opacity: 0.06, elevation: 1 },
  '--shadow-sm': { offsetY: 1, radius: 3, opacity: 0.07, elevation: 2 },
  '--shadow-md': { offsetY: 4, radius: 14, opacity: 0.08, elevation: 4 },
  '--shadow-lg': { offsetY: 12, radius: 32, opacity: 0.12, elevation: 8 },
  '--shadow-overlay': { offsetY: 24, radius: 60, opacity: 0.22, elevation: 16 },
};

export type NombreSombra = keyof typeof TABLA;

/**
 * Estilo de sombra para un token `--shadow-*`.
 *
 * En web se devuelve la cadena `boxShadow` tal cual está en `elevation.css`,
 * para no producir una sombra distinta de la del design system.
 */
export function sombra(nombre: NombreSombra): ViewStyle {
  const eq = TABLA[nombre];
  if (!eq) return {};
  if (Platform.OS === 'android') return { elevation: eq.elevation };
  return {
    shadowColor: COLOR_SOMBRA,
    shadowOffset: { width: 0, height: eq.offsetY },
    shadowRadius: eq.radius,
    shadowOpacity: eq.opacity,
  };
}

/**
 * Foco. En nativo el anillo no se resuelve con sombra sino con un borde de 2px
 * en `--border-focus`; sobre la superficie de la navegación, blanco.
 *
 * `sobreOscuro` es el nombre que quedó de cuando la nav era oscura en los dos
 * temas. Desde la 1.5.0 del design system la del tutor es el naranja claro de
 * marca, pero su contenido sigue siendo blanco y ahí el anillo es el mismo
 * (`--ring-focus-on-brand` del tema tutor apunta a `--ring-focus-on-dark`): lo
 * que cambió es el fondo, no el color del foco.
 *
 * Devuelve solo el color: el ancho lo pone el componente, que ya reserva el
 * espacio del borde en su estado normal para que el foco no mueva el layout.
 */
export function colorDeFoco(borderFocus: string, sobreOscuro = false): string {
  return sobreOscuro ? '#FFFFFF' : borderFocus;
}

export const ANCHO_BORDE_FOCO = 2;
