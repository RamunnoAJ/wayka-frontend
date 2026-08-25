export interface CheckboxProps {
  label: React.ReactNode;
  description?: string;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
