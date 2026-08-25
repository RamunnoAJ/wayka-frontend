import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '../../../../../src/components/Placeholder';

/** PLACEHOLDER — carga de evento clínico (Alcance de Plataformas, 3.4). */
export default function NuevoEventoClinico() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Placeholder
      titulo="Nuevo evento clínico"
      detalle={`Formulario por tipo de evento. paciente: ${id}`}
    />
  );
}
