export interface IconProps {
  /** Nombre del icono en Lucide, kebab-case. Ej: "syringe", "calendar-days". */
  name: string;
  /** Lado en px. Default 20. */
  size?: number;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
