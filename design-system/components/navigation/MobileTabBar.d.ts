export interface MobileTabItem { value: string; label: string; icon: string }
export interface MobileTabBarProps {
  items: MobileTabItem[];
  value?: string;
  onChange?: (value: string) => void;
}
export declare function MobileTabBar(props: MobileTabBarProps): JSX.Element;
