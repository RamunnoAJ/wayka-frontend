/**
 * Boton de accion de Wayka.
 * @startingPoint section="Core" subtitle="Botones, tonos y tamanos" viewport="700x220"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = violeta, la unica accion principal por pantalla; 'accent' esta deprecado (alias de primary). */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  /** touch = 52px, para movil. */
  size?: 'sm' | 'md' | 'lg' | 'touch';
  /** Nombre de icono Lucide a la izquierda. */
  iconLeft?: string;
  iconRight?: string;
  block?: boolean;
  /** Muestra spinner y deshabilita. */
  loading?: boolean;
}
export declare function Button(props: ButtonProps): JSX.Element;
