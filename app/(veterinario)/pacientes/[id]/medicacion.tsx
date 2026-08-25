import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '../../../../src/components/Placeholder';

/** PLACEHOLDER — medicación del paciente (Alcance de Plataformas, 3.5). */
export default function MedicacionPaciente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Placeholder titulo="Medicación" detalle={`Activa e histórica. paciente: ${id}`} />;
}
