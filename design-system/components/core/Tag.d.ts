export interface TagProps {
  children?: React.ReactNode;
  /** Si se pasa, muestra la X de quitar. */
  onRemove?: () => void;
  tone?: 'neutral' | 'danger';
}
export declare function Tag(props: TagProps): JSX.Element;
