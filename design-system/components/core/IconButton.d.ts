export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Nombre de icono Lucide. */
  icon: string;
  /** Obligatorio: aria-label y tooltip. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid' | 'on-dark';
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
