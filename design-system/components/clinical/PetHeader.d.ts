export interface PetHeaderProps {
  name: string;
  species?: 'canino' | 'felino' | 'otro';
  breed?: string;
  sex?: string;
  age?: string;
  weight?: string;
  /** Numero de microchip. */
  chip?: string;
  owner?: string;
  actions?: React.ReactNode;
  size?: 'lg' | 'md';
}
export declare function PetHeader(props: PetHeaderProps): JSX.Element;
