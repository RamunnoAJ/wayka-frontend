/**
 * Contenedor base de Wayka: fondo blanco, borde 1px, radio 16, sombra baja.
 * @startingPoint section="Core" subtitle="Contenedores, badges y avatares" viewport="700x260"
 */
export interface CardProps {
  title?: React.ReactNode;
  /** Nodo alineado a la derecha del encabezado (boton, link). */
  action?: React.ReactNode;
  /** 'clinical' y 'owner' estan deprecados (renderizan como default): la autoria la marca DataField. */
  tone?: 'default' | 'sunken' | 'clinical' | 'owner';
  padded?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
