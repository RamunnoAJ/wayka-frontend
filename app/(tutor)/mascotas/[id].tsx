import { useLocalSearchParams } from 'expo-router';

import { FichaDeMiMascota } from '../../../src/features/tutor-movil';
import { EntradaDePantalla } from '../../../src/components';

/** Ficha de mi mascota, solo lectura salvo el peso (Alcance de Plataformas, 5.3 y 5.7). */
export default function FichaDeMiMascotaRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <EntradaDePantalla>
      <FichaDeMiMascota pacienteId={id} />
    </EntradaDePantalla>
  );
}
