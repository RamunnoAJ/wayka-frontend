import { router } from 'expo-router';

import { EntradaDePantalla } from '../../../src/components';
import { AtencionesDeHoy } from '../../../src/features/consultas';

/** Lo que se atendió hoy y lo que falta documentar (Alcance de Plataformas, 3.3.1). */
export default function Atenciones() {
  return (
    <EntradaDePantalla>
      <AtencionesDeHoy
        onAbrirPaciente={(pacienteId) => router.push(`/(veterinario)/pacientes/${pacienteId}`)}
      />
    </EntradaDePantalla>
  );
}
