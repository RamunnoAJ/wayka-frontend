export interface CalendarEventProps {
  /** "Tipo · Mascota", ej "Control · Mora". */
  title: string;
  /** Rango horario, ej "10:00 — 10:30". */
  time?: string;
  /** Default "pendiente". */
  status?: 'pendiente' | 'cumplido' | 'vencido';
  onClick?: () => void;
}
export declare function CalendarEvent(props: CalendarEventProps): JSX.Element;
export interface CalendarWeekDay {
  /** Numero del dia del mes. */
  date: number;
  /** Etiqueta de la cabecera; default Dom..Sáb por posicion. */
  dow?: string;
  /** Pinta el numero como pastilla llena. */
  today?: boolean;
  events?: CalendarEventProps[];
}
export interface CalendarWeekProps {
  /** 7 entradas, de domingo a sabado. */
  days: CalendarWeekDay[];
  onEventClick?: (event: CalendarEventProps, day: CalendarWeekDay) => void;
  /** Alto minimo de cada columna en px. Default 260. */
  minHeight?: number;
}
export declare function CalendarWeek(props: CalendarWeekProps): JSX.Element;
