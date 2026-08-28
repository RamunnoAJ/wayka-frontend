export interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Unico proveedor del alcance. */
  provider?: 'google';
  /** Cambia solo la etiqueta: "Continuar con Google" / "Registrarme con Google". */
  mode?: 'login' | 'signup';
  /** touch = 52px, el default en movil. */
  size?: 'md' | 'touch';
  block?: boolean;
  /** Reemplaza la etiqueta. No cambiar el nombre "Google". */
  label?: string;
}
export declare function SocialButton(props: SocialButtonProps): JSX.Element;
