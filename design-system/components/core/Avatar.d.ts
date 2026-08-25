export interface AvatarProps {
  /** Usado para las iniciales y el alt. */
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Si se pasa, muestra icono de especie y esquinas redondeadas en vez de circulo. */
  species?: 'canino' | 'felino' | 'otro';
  tone?: 'accent' | 'brand';
}
export declare function Avatar(props: AvatarProps): JSX.Element;
