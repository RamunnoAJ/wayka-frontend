export interface PatientRowProps {
  name: string;
  species?: 'canino' | 'felino' | 'otro';
  breed?: string;
  age?: string;
  /** Nombre del tutor. */
  owner?: string;
  lastVisit?: string;
  /** Alergias criticas; se muestran las 2 primeras en la fila. */
  allergies?: string[];
  /** Cantidad de medicaciones activas. */
  medications?: number;
  selected?: boolean;
  onClick?: () => void;
}
export declare function PatientRow(props: PatientRowProps): JSX.Element;
