export interface RadioProps {
  label: React.ReactNode;
  description?: string;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  name?: string;
  value?: string;
  disabled?: boolean;
}
export declare function Radio(props: RadioProps): JSX.Element;
