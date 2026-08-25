export interface TimelineEventProps {
  kind?: 'consulta' | 'vacuna' | 'cirugia' | 'estudio' | 'peso' | 'nota';
  title: string;
  date?: string;
  /** Veterinario que cargo el evento. */
  author?: string;
  children?: React.ReactNode;
  attachments?: number;
  /** Ultimo de la lista: corta la linea vertical. */
  last?: boolean;
}
export declare function TimelineEvent(props: TimelineEventProps): JSX.Element;
