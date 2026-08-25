export interface DialogProps {
  open?: boolean;
  title?: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
  /** Botonera del pie. */
  footer?: React.ReactNode;
  onClose?: () => void;
  width?: number;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
