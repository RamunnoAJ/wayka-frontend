import { AgendaDeLaClinica } from '../../src/features/agenda';
import { EntradaDePantalla } from '../../src/components';

/**
 * Agenda de la clínica para el clínica_admin (Alcance de Plataformas, 3.2.2).
 *
 * Es el mismo calendario que ve el veterinario, con dos diferencias que salen
 * del rol y no de la pantalla: no ofrece asentar la atención —eso es afirmación
 * asistencial de quien atendió— y la fila no lleva a la ficha del paciente,
 * porque este rol no la alcanza.
 *
 * Lo que sí hace, y es la razón de que exista, es repartir: el contador de "sin
 * asignar" del tablero es la cola de lo que hay que asignar, y hasta ahora la
 * señalaba sin dejar hacer nada.
 */
export default function Agenda() {
  return (
    <EntradaDePantalla>
      <AgendaDeLaClinica />
    </EntradaDePantalla>
  );
}
