import { EntradaDePantalla } from '../../../src/components';
import { TableroDePropuestas } from '../../../src/features/propuestas';

/**
 * Tablero de propuestas del tutor (Alcance de Plataformas, 5.13). Se entra desde
 * Ajustes: no es una cuarta pestaña.
 *
 * **Necesita conexión**: el tablero no está en la copia local (doc 11, 2 y 5).
 * Sin señal el pedido falla y la pantalla lo explica, en vez de mostrar una
 * lista vieja con un contador que ya no es cierto.
 */
export default function PropuestasDelTutor() {
  return (
    <EntradaDePantalla>
      <TableroDePropuestas />
    </EntradaDePantalla>
  );
}
