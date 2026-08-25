export interface SelectOption { value: string; label: string }
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  /** Strings sueltos o {value,label}. */
  options?: Array<string | SelectOption>;
  hint?: string;
}
export declare function Select(props: SelectProps): JSX.Element;
