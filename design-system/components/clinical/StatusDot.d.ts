export interface StatusDotProps {
  status?: 'pendiente' | 'cumplido' | 'vencido' | 'activo' | 'inactivo';
  label?: React.ReactNode;
  size?: number;
}
export declare function StatusDot(props: StatusDotProps): JSX.Element;
