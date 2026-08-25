export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Fila secundaria: buscador, tabs, filtros. */
  children?: React.ReactNode;
}
export declare function PageHeader(props: PageHeaderProps): JSX.Element;
