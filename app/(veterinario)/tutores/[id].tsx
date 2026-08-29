import { useLocalSearchParams } from 'expo-router';

import { FichaDeTutor } from '../../../src/features/tutor';
import { EntradaDePantalla } from '../../../src/components';

/** Ficha de tutor: lectura, edición y baja lógica (Alcance de Plataformas, 3.3). */
export default function FichaDeTutorRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <EntradaDePantalla>
      <FichaDeTutor tutorId={id} />
    </EntradaDePantalla>
  );
}
