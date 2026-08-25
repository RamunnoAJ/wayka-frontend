export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}
export declare function Switch(props: SwitchProps): JSX.Element;
