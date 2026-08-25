export interface SidebarItem { value: string; label: string; icon: string; badge?: number }
export interface SidebarNavProps {
  items: SidebarItem[];
  value?: string;
  onChange?: (value: string) => void;
  /** Nombre de la clinica bajo el logo. */
  clinic?: string;
  user?: { name: string; role: string };
  /** Ruta relativa al logo desde la pagina que lo monta. */
  logoSrc?: string;
}
export declare function SidebarNav(props: SidebarNavProps): JSX.Element;
