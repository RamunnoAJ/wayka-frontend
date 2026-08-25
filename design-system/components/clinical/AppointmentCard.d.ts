/**
 * Cita del calendario con sus tres estados.
 * @startingPoint section="Clinico" subtitle="Citas: pendiente, cumplido, vencido" viewport="700x220"
 */
export interface AppointmentCardProps {
  /** Los tres estados del calendario de Wayka. */
  status?: 'pendiente' | 'cumplido' | 'vencido';
  /** Ej "09:30". */
  time?: string;
  title: string;
  patient?: string;
  vet?: string;
  actions?: React.ReactNode;
  compact?: boolean;
}
export declare function AppointmentCard(props: AppointmentCardProps): JSX.Element;
