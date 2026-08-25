export interface DataTableColumn {
  /** Clave estable de la columna. */
  key?: string;
  /** Titulo visible; vacio para la columna del avatar. */
  label?: string;
  /** Ancho fijo en px o CSS. */
  width?: number | string;
  /** Valor flex cuando la columna es elastica, ej "1 1 200px". */
  grow?: string;
  /** Default "left". */
  align?: 'left' | 'right' | 'center';
}
export interface DataTableProps {
  columns: DataTableColumn[];
  /** Las filas, normalmente PatientRow o similar. */
  children?: React.ReactNode;
  /** Que mostrar sin filas, normalmente un EmptyState. */
  empty?: React.ReactNode;
}
export declare function DataTable(props: DataTableProps): JSX.Element;
