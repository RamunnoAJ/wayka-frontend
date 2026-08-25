import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '../../../src/components/Placeholder';

/** PLACEHOLDER — ficha de paciente: datos, historial y medicación. */
export default function FichaPaciente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Placeholder titulo="Ficha de paciente" detalle={`id: ${id}`} />;
}
