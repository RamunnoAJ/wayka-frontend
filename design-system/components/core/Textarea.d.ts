export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  rows?: number;
}
export declare function Textarea(props: TextareaProps): JSX.Element;
