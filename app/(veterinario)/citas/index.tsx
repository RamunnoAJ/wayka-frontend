import { router } from 'expo-router';

import { AgendaDeLaClinica } from '../../../src/features/agenda';
import { EntradaDePantalla } from '../../../src/components';

/** Agenda de la clínica: citas pendientes y vencidas (Alcance de Plataformas, 3.6). */
export default function Citas() {
  return (
    <EntradaDePantalla>
      <AgendaDeLaClinica
        onAbrirPaciente={(pacienteId) => router.push(`/(veterinario)/pacientes/${pacienteId}`)}
      />
    </EntradaDePantalla>
  );
}
