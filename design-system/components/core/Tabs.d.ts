export interface TabItem { value: string; label: string; count?: number }
export interface TabsProps {
  items: TabItem[];
  value?: string;
  onChange?: (value: string) => void;
  /** underline para navegacion de seccion; pill para filtros. */
  variant?: 'underline' | 'pill';
}
export declare function Tabs(props: TabsProps): JSX.Element;
