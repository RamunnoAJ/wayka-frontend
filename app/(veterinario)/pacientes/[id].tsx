import { useLocalSearchParams } from 'expo-router';

import { FichaDePaciente } from '../../../src/features/paciente';

/**
 * Ficha de paciente: datos básicos, historial clínico, medicación, calendario y
 * adjuntos (Alcance de Plataformas, 3.3).
 */
export default function FichaDePacienteRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FichaDePaciente pacienteId={id} />;
}
