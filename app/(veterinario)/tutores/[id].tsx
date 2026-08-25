import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '../../../src/components/Placeholder';

/** PLACEHOLDER — ficha de tutor. */
export default function FichaTutor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Placeholder titulo="Ficha de tutor" detalle={`id: ${id}`} />;
}
