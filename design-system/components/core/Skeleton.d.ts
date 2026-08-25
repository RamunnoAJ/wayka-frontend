export interface SkeletonProps {
  /** Ancho CSS. Default "100%". Se ignora si circle. */
  width?: number | string;
  /** Alto en px o CSS. Default 14. En circle define el diametro. */
  height?: number | string;
  /** Radio de esquina. Default var(--radius-sm). */
  radius?: string;
  /** Circulo del tamano de height, para avatares. */
  circle?: boolean;
  style?: React.CSSProperties;
}
export declare function Skeleton(props: SkeletonProps): JSX.Element;
export interface SkeletonTextProps {
  /** Cantidad de lineas. Default 3. */
  lines?: number;
  /** Separacion en px. Default 8. */
  gap?: number;
}
export declare function SkeletonText(props: SkeletonTextProps): JSX.Element;
