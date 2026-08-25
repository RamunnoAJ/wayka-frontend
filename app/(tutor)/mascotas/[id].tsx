import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '../../../src/components/Placeholder';

/** PLACEHOLDER — ficha de mascota, solo lectura salvo peso (5.3 y 5.7). */
export default function FichaMascota() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Placeholder
      titulo="Ficha de mascota"
      detalle={`Solo lectura del historial clínico. id: ${id}`}
    />
  );
}
