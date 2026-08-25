export interface AllergyChipProps {
  label: string;
  /** alta = pildora roja plena; media/baja = contorno. */
  severity?: 'alta' | 'media' | 'baja';
}
export declare function AllergyChip(props: AllergyChipProps): JSX.Element;
