export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Texto de ayuda bajo el campo. */
  hint?: string;
  /** Mensaje de error; pinta el borde en danger y reemplaza al hint. */
  error?: string;
  /** Icono Lucide dentro del campo, a la izquierda. */
  icon?: string;
  /** Unidad u otro sufijo, ej "kg". */
  suffix?: string;
}
export declare function Input(props: InputProps): JSX.Element;
