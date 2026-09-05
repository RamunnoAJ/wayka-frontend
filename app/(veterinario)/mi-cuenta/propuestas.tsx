import { EntradaDePantalla } from '../../../src/components';
import { TableroDePropuestas } from '../../../src/features/propuestas';

/**
 * Tablero de propuestas del veterinario (Alcance de Plataformas, 3.8), con
 * paridad entre web y móvil como el resto de sus pantallas. Se entra desde
 * Mi cuenta: no ocupa un lugar en el menú.
 *
 * Es el mismo componente que abre el tutor desde Ajustes: la audiencia sale del
 * token, así que la pantalla no decide nada por rol.
 */
export default function PropuestasDelVeterinario() {
  return (
    <EntradaDePantalla>
      <TableroDePropuestas />
    </EntradaDePantalla>
  );
}
