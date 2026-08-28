export interface ProgressBarProps {
  /** 0-100. Ignorado si indeterminate. */
  value?: number;
  /** Sin porcentaje conocido: barra que recorre. Usar cuando la subida dura menos de ~1 s. */
  indeterminate?: boolean;
  size?: 'sm' | 'md';
  tone?: 'primary' | 'success' | 'danger';
  /** Texto sobre la barra, a la izquierda. */
  label?: React.ReactNode;
  /** Porcentaje a la derecha. No se muestra si indeterminate. */
  showValue?: boolean;
}
export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
