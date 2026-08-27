import { useLocalSearchParams } from 'expo-router';

import { FichaDeVeterinario } from '../../../src/features/veterinario';

/** Edición de una ficha del plantel (Alcance de Plataformas, 3.2). */
export default function FichaDeVeterinarioRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FichaDeVeterinario veterinarioId={id} />;
}
