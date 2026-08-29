import { router } from 'expo-router';

import { MisMascotas } from '../../../src/features/tutor-movil';
import { EntradaDePantalla } from '../../../src/components';

/** Mis mascotas (Alcance de Plataformas, 5.2). */
export default function MascotasDelTutor() {
  return (
    <EntradaDePantalla>
      <MisMascotas onAbrir={(mascota) => router.push(`/(tutor)/mascotas/${mascota.id}`)} />
    </EntradaDePantalla>
  );
}
