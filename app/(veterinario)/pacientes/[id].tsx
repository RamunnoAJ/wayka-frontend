import { router, useLocalSearchParams } from 'expo-router';

import { FichaDePaciente } from '../../../src/features/paciente';
import { EntradaDePantalla } from '../../../src/components';

/**
 * Ficha de paciente: datos básicos, historial clínico, medicación, calendario y
 * adjuntos (Alcance de Plataformas, 3.3).
 */
export default function FichaDePacienteRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <EntradaDePantalla>
      <FichaDePaciente
        pacienteId={id}
        onSalirDeLaCartera={() => router.replace('/(veterinario)/pacientes')}
      />
    </EntradaDePantalla>
  );
}
