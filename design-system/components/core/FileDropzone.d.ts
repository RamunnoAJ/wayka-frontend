import type { WaykaFileType } from './UploadItem';
export interface FileDropzoneProps {
  /** Tipo DECLARADO al backend. Una zona por tipo: la UI declara, no adivina. */
  type?: WaykaFileType;
  /** Limite del backend (413). Se muestra siempre, antes de elegir el archivo. */
  maxSizeMB?: number;
  /** 'over' = arrastre encima; 'rejected' = tipo o tamano no admitido. */
  state?: 'idle' | 'over' | 'rejected';
  /** Motivo concreto del rechazo. */
  rejectedReason?: string;
  /** Abre el selector clasico de archivos. */
  onPick?: () => void;
  /** false = sin drag & drop (React Native): degrada a un boton block size="touch". */
  dragDrop?: boolean;
  /** Reemplaza el texto principal en reposo. */
  title?: string;
  disabled?: boolean;
}
export declare function FileDropzone(props: FileDropzoneProps): JSX.Element;
