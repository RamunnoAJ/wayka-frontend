import { useLocalSearchParams } from 'expo-router';

import { FichaDeTutor } from '../../../src/features/tutor';

/** Ficha de tutor: lectura, edición y baja lógica (Alcance de Plataformas, 3.3). */
export default function FichaDeTutorRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FichaDeTutor tutorId={id} />;
}
