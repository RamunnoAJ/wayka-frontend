import { router, useLocalSearchParams } from 'expo-router';

import { EntradaDePantalla } from '../../../../src/components';
import { CompartirMiMascota } from '../../../../src/features/accesos/CompartirMiMascota';
import { useMiMascota } from '../../../../src/features/tutor-movil/queries';

/** Compartir una mascota (Alcance de Plataformas, 5.9). */
export default function Compartir() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mascota = useMiMascota(id);

  return (
    <EntradaDePantalla>
      <CompartirMiMascota
        pacienteId={id}
        nombreDeLaMascota={mascota.data?.nombre ?? 'tu mascota'}
        onListo={() => router.back()}
      />
    </EntradaDePantalla>
  );
}
