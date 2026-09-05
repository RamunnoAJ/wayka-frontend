import { ESTADO_DE_PROPUESTA, type EstadoDePropuesta } from '../../api/propuesta';
import { Badge } from '../../components';

/**
 * `descartada` va en `neutral` y no en `danger`: descartar una propuesta no es
 * un riesgo, y `danger` es el único tono que sube el contraste — gastarlo acá
 * sería destacar justo lo que menos importa.
 */
const META: Record<
  EstadoDePropuesta,
  { etiqueta: string; tone: 'neutral' | 'info' | 'primary' | 'success' }
> = {
  [ESTADO_DE_PROPUESTA.RECIBIDA]: { etiqueta: 'Recibida', tone: 'neutral' },
  [ESTADO_DE_PROPUESTA.EN_ANALISIS]: { etiqueta: 'En análisis', tone: 'info' },
  [ESTADO_DE_PROPUESTA.PLANIFICADA]: { etiqueta: 'Planificada', tone: 'primary' },
  [ESTADO_DE_PROPUESTA.HECHA]: { etiqueta: 'Hecha', tone: 'success' },
  [ESTADO_DE_PROPUESTA.DESCARTADA]: { etiqueta: 'Descartada', tone: 'neutral' },
};

export function EtiquetaDeEstado({ estado }: { estado: EstadoDePropuesta }) {
  const meta = META[estado];
  if (!meta) return null;
  return (
    <Badge tone={meta.tone} size="sm">
      {meta.etiqueta}
    </Badge>
  );
}
