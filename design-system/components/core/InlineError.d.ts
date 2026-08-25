export interface InlineErrorProps {
  /** Titulo del error. Default "No pudimos cargar esto". */
  title?: string;
  /** Que paso y que puede hacer la persona. */
  description?: string;
  /** Si se pasa, se muestra el boton de reintento. */
  onRetry?: () => void;
  /** Texto del boton. Default "Reintentar". */
  retryLabel?: string;
  /** Version de una linea, alineada a la izquierda, para bloques chicos. */
  compact?: boolean;
}
export declare function InlineError(props: InlineErrorProps): JSX.Element;
