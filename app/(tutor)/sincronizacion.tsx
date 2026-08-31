import { EntradaDePantalla } from '../../src/components';
import { Rechazos } from '../../src/features/sincronizacion';

/**
 * Cambios que el tutor escribió sin conexión y el backend no pudo aplicar
 * (doc 11, sección 7). Solo tiene sentido en la app: la web no lleva copia local.
 */
export default function SincronizacionDelTutor() {
  return (
    <EntradaDePantalla>
      <Rechazos />
    </EntradaDePantalla>
  );
}
