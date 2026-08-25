export interface ToastProps {
  tone?: 'success' | 'danger' | 'info' | 'warning';
  title: React.ReactNode;
  description?: string;
  onClose?: () => void;
}
export declare function Toast(props: ToastProps): JSX.Element;
