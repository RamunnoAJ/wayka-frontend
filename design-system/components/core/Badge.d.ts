export interface BadgeProps {
  children?: React.ReactNode;
  /** 'brand' y 'accent' estan deprecados (alias de primary). Color solo cuando el estado tiene significado real. */
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'accent';
  /** Icono Lucide antepuesto. */
  icon?: string;
  /** Fondo pleno en el color del tono. */
  solid?: boolean;
  size?: 'sm' | 'md';
}
export declare function Badge(props: BadgeProps): JSX.Element;
