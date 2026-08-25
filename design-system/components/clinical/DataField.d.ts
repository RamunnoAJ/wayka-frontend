export interface DataFieldProps {
  label: string;
  value: React.ReactNode;
  /** clinical = cargado por el veterinario (punto violeta); owner = del tutor (punto naranja). */
  source?: 'clinical' | 'owner';
  /** Si es false muestra el candado "Solo lectura". */
  editable?: boolean;
  onEdit?: () => void;
  unit?: string;
}
export declare function DataField(props: DataFieldProps): JSX.Element;
