export interface EmptyStateProps {
  /** Icono Lucide. Default "paw-print". */
  icon?: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
