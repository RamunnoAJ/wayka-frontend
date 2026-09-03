import { router, useLocalSearchParams } from 'expo-router';

import { EntradaDePantalla } from '../../../../src/components';
import { CargaDeAntecedentes } from '../../../../src/features/tutor-movil';
import { useMiMascota } from '../../../../src/features/tutor-movil/queries';

/**
 * Cargar antecedentes de una mascota (Alcance de Plataformas, 5.12).
 *
 * `?onboarding=1` es el mismo paso justo después del alta. No cambia lo que se
 * puede cargar —la capacidad no está atada al alta (Reglas de Negocio, 4.23)—:
 * cambia adónde vuelve al terminar y cómo se nombra la salida.
 */
export default function AntecedentesDeMiMascota() {
  const { id, onboarding, foto } = useLocalSearchParams<{
    id: string;
    onboarding?: string;
    foto?: string;
  }>();
  const mascota = useMiMascota(id);

  return (
    <EntradaDePantalla>
      <CargaDeAntecedentes
        pacienteId={id}
        nombreDeMascota={mascota.data?.nombre}
        enOnboarding={onboarding === '1'}
        fotoQueNoSubio={foto === 'fallo'}
        onTerminar={() => router.replace(`/(tutor)/mascotas/${id}`)}
      />
    </EntradaDePantalla>
  );
}
