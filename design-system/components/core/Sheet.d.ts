export interface SheetProps {
  open?: boolean;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  /** Acciones al pie; en movil van a ancho completo. */
  footer?: React.ReactNode;
  onClose?: () => void;
  /** Borde de entrada. Default "bottom". */
  side?: 'bottom' | 'right';
  /** Alto del panel inferior. Default "auto". */
  height?: number | string;
  /** Ancho del panel lateral. Default 420. */
  width?: number | string;
}
export declare function Sheet(props: SheetProps): JSX.Element | null;
