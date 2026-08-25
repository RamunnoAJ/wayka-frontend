export interface MedicationItemProps {
  name: string;
  /** Ej "0,1 mg/kg". */
  dose?: string;
  /** Ej "cada 24 h". */
  frequency?: string;
  until?: string;
  /** Veterinario que la indico. */
  prescriber?: string;
  status?: 'activo' | 'finalizado' | 'suspendido';
  action?: React.ReactNode;
}
export declare function MedicationItem(props: MedicationItemProps): JSX.Element;
