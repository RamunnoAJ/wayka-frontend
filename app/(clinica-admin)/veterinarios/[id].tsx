import { useLocalSearchParams } from 'expo-router';

import { FichaDeVeterinario } from '../../../src/features/veterinario';
import { EntradaDePantalla } from '../../../src/components';

/** Edición de una ficha del plantel (Alcance de Plataformas, 3.2). */
export default function FichaDeVeterinarioRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <EntradaDePantalla>
      <FichaDeVeterinario veterinarioId={id} />
    </EntradaDePantalla>
  );
}
