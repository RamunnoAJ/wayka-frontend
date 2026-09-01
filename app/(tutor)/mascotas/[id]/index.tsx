import { router, useLocalSearchParams } from 'expo-router';

import { FichaDeMiMascota } from '../../../../src/features/tutor-movil';
import { EntradaDePantalla } from '../../../../src/components';

/** Ficha de mi mascota (Alcance de Plataformas, 5.3 y 5.7). */
export default function FichaDeMiMascotaRuta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <EntradaDePantalla>
      <FichaDeMiMascota
        pacienteId={id}
        onVerAccesos={() => router.push(`/(tutor)/mascotas/${id}/accesos`)}
      />
    </EntradaDePantalla>
  );
}
