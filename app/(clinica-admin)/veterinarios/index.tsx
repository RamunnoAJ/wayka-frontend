import { Plantel } from '../../../src/features/veterinario';
import { EntradaDePantalla } from '../../../src/components';

/** Plantel de la clínica: listado, alta y baja lógica (procesos 4.12 y 4.13). */
export default function ListadoVeterinarios() {
  return (
    <EntradaDePantalla>
      <Plantel />
    </EntradaDePantalla>
  );
}
