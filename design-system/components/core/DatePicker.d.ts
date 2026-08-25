export interface CalendarProps {
  /** Fecha ISO "YYYY-MM-DD". */
  value?: string;
  onChange?: (value: string) => void;
  /** Fecha ISO minima seleccionable. */
  min?: string;
}
export declare function Calendar(props: CalendarProps): JSX.Element;
export interface DatePickerProps extends CalendarProps {
  label?: string;
  /** Texto de ayuda bajo el campo. */
  hint?: string;
  /** Texto cuando no hay fecha. Default "Elegir fecha". */
  placeholder?: string;
}
export declare function DatePicker(props: DatePickerProps): JSX.Element;
