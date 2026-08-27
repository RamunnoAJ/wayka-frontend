import { router } from 'expo-router';

import { MisMascotas } from '../../../src/features/tutor-movil';

/** Mis mascotas (Alcance de Plataformas, 5.2). */
export default function MascotasDelTutor() {
  return <MisMascotas onAbrir={(mascota) => router.push(`/(tutor)/mascotas/${mascota.id}`)} />;
}
