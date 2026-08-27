import { router } from 'expo-router';

import { AgendaDeLaClinica } from '../../../src/features/agenda';

/** Agenda de la clínica: citas pendientes y vencidas (Alcance de Plataformas, 3.6). */
export default function Citas() {
  return (
    <AgendaDeLaClinica
      onAbrirPaciente={(pacienteId) => router.push(`/(veterinario)/pacientes/${pacienteId}`)}
    />
  );
}
