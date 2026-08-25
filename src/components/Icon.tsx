import {
  ArrowLeft,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  TriangleAlert,
  type LucideProps,
} from 'lucide-react-native';
import type { ComponentType } from 'react';

import { useTheme } from '../theme';

/**
 * Íconos, sobre `lucide-react-native` (los mismos glifos de Lucide que el
 * design system consume por `mask-image` en web, pero como SVG: `mask-image`
 * no existe en nativo — la ruta que propone el BRIEF, sección 9).
 *
 * El vocabulario público son **los nombres del design system**, no los de la
 * librería: si Wayka produce su propio set, se cambia este mapa y ninguna
 * pantalla se entera. Se registran solo los íconos en uso — agregar uno es
 * sumar una línea, y así el nombre inventado falla en compilación en vez de
 * renderizar un hueco.
 */
const REGISTRO = {
  mail: Mail,
  lock: Lock,
  check: Check,
  eye: Eye,
  'eye-off': EyeOff,
  'loader-circle': LoaderCircle,
  'arrow-left': ArrowLeft,
  // Lucide renombró `alert-circle` a `circle-alert`; el design system todavía
  // usa el nombre viejo, que es el que vale acá.
  'alert-circle': CircleAlert,
  'alert-triangle': TriangleAlert,
} as const satisfies Record<string, ComponentType<LucideProps>>;

export type NombreDeIcono = keyof typeof REGISTRO;

interface IconProps {
  name: NombreDeIcono;
  size?: number;
  /** Por defecto hereda el color del texto que lo acompaña. */
  color?: string;
}

export function Icon({ name, size = 20, color }: IconProps) {
  const { t } = useTheme();
  const Glifo = REGISTRO[name];
  return <Glifo size={size} color={color ?? t['--text-body']} strokeWidth={2} />;
}
