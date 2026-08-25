/**
 * Panel de datos criticos en la cabecera de la ficha de paciente.
 * @startingPoint section="Clinico" subtitle="Alergias y medicacion activa" viewport="700x300"
 */
export interface CriticalPanelProps {
  /** allergy = rojo; medication = naranja. */
  kind?: 'allergy' | 'medication';
  title: string;
  /** Filas ya renderizadas (AllergyChip / MedicationItem). Vacio muestra el estado neutro. */
  items?: React.ReactNode[];
  emptyLabel?: string;
  compact?: boolean;
}
export declare function CriticalPanel(props: CriticalPanelProps): JSX.Element;
