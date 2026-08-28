export interface PermissionCardProps {
  /** Estado del permiso de push resuelto por el SO. */
  status?: 'sin-preguntar' | 'concedido' | 'denegado';
  /** Reemplaza el titulo por defecto de cada estado. */
  title?: string;
  /** Reemplaza el texto por defecto. En 'denegado' tiene que nombrar la consecuencia concreta. */
  body?: string;
  /** Solo en 'sin-preguntar': dispara el prompt del SO. */
  onAsk?: () => void;
  /** Solo en 'denegado': abre los ajustes del telefono (el SO no vuelve a preguntar). */
  onOpenSettings?: () => void;
  /** Opcional en 'sin-preguntar'. */
  onDismiss?: () => void;
  askLabel?: string;
  dismissLabel?: string;
  settingsLabel?: string;
}
export declare function PermissionCard(props: PermissionCardProps): JSX.Element;
