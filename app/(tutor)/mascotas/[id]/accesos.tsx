import { router, useLocalSearchParams } from 'expo-router';

import { EntradaDePantalla } from '../../../../src/components';
import { AccesosDeMiMascota } from '../../../../src/features/accesos/AccesosDeMiMascota';
import { useMiMascota } from '../../../../src/features/tutor-movil/queries';

/** Quién la ve (Alcance de Plataformas, 5.10). */
export default function Accesos() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mascota = useMiMascota(id);

  return (
    <EntradaDePantalla>
      <AccesosDeMiMascota
        pacienteId={id}
        nombreDeLaMascota={mascota.data?.nombre ?? 'tu mascota'}
        administra={mascota.data?.nivel_de_acceso === 'dueno'}
        onCompartir={() => router.push(`/(tutor)/mascotas/${id}/compartir`)}
      />
    </EntradaDePantalla>
  );
}
