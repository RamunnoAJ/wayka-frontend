import { router } from 'expo-router';

import { BuscadorDeTutores } from '../../../src/features/tutor';

/** Búsqueda y alta de fichas de tutor (Alcance de Plataformas, 3.3). */
export default function ListadoTutores() {
  return (
    <BuscadorDeTutores onElegir={(tutor) => router.push(`/(veterinario)/tutores/${tutor.id}`)} />
  );
}
