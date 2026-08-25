export interface MobileHeaderProps {
  title: React.ReactNode;
  onBack?: () => void;
  action?: React.ReactNode;
  /** dark = violeta pleno, para pantallas de contexto del tutor. */
  tone?: 'light' | 'dark';
}
export declare function MobileHeader(props: MobileHeaderProps): JSX.Element;
