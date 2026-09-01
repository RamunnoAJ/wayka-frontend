import { Badge } from '../../components';
import type { NivelDeAcceso } from '../../api/paciente';

/**
 * Con qué nivel se alcanza una mascota ajena.
 *
 * El copy no dice "co-tutor" ni "nivel": dice qué se puede hacer, que es la
 * única pregunta que quien lo lee se está haciendo.
 */
export function EtiquetaDeNivel({ nivel }: { nivel: NivelDeAcceso }) {
  if (nivel === 'dueno') {
    return <Badge tone="neutral">Es tuya</Badge>;
  }
  return nivel === 'edicion' ? (
    <Badge tone="info">Podés editar</Badge>
  ) : (
    <Badge tone="neutral">Solo mirás</Badge>
  );
}
