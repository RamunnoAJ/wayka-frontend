export interface ToastProps {
  /** Solo pinta el punto. La tipografia y la superficie no cambian con el tono. */
  tone?: 'success' | 'danger' | 'info' | 'warning';
  title: React.ReactNode;
  description?: string;
  /** Accion opcional en texto subrayado ("Deshacer", "Ver"). Una sola. */
  action?: { label: string; onClick: () => void };
  onClose?: () => void;
}
export declare function Toast(props: ToastProps): JSX.Element;
