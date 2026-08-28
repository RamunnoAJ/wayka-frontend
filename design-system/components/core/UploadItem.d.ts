export type WaykaFileType = 'foto' | 'pdf' | 'estudio';
export interface UploadItemProps {
  name: string;
  /** Peso ya formateado por el consumidor: "1,2 MB". */
  size?: string;
  /** Tipo DECLARADO al backend, no inferido de la extension. */
  type?: WaykaFileType;
  status?: 'subiendo' | 'listo' | 'fallo';
  /** 0-100, solo con status="subiendo". */
  progress?: number;
  /** Subida sin porcentaje conocido. */
  indeterminate?: boolean;
  /** Motivo del fallo, con el dato concreto: "Supera el limite de 10 MB" (413). */
  errorMessage?: string;
  /** 'other' = lo subio el otro rol: se ve completo, sin accion de retirar y con la autoria a la vista. */
  owner?: 'mine' | 'other';
  ownerName?: string;
  /** Retirar (o cancelar, si esta subiendo). Solo se pasa cuando owner === 'mine'. */
  onRemove?: () => void;
  onRetry?: () => void;
  removeLabel?: string;
}
export declare function UploadItem(props: UploadItemProps): JSX.Element;
export declare const FILE_TYPES: Record<WaykaFileType, { icon: string; label: string; accept: string; human: string }>;
