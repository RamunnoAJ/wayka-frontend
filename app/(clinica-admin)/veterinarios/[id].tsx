import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '../../../src/components/Placeholder';

/** PLACEHOLDER — ficha de un veterinario del plantel. */
export default function FichaVeterinario() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Placeholder titulo="Ficha de veterinario" detalle={`id: ${id}`} />;
}
