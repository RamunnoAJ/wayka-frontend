import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { InlineError, SkeletonText } from '../../../../src/components';
import { mensajeDeError } from '../../../../src/lib/errores';
import { DatosDeMiMascota } from '../../../../src/features/tutor-movil/DatosDeMiMascota';
import { useMiMascota } from '../../../../src/features/tutor-movil/queries';
import { useGuardarDatosDeLaMascota } from '../../../../src/features/sincronizacion/queries';

/**
 * Los datos no clínicos de una mascota (Alcance de Plataformas, 5.7).
 *
 * Pantalla propia y no un bloque de la ficha: son cinco campos que se corrigen
 * de a varios juntos y una vez, mientras que el peso —lo único que se toca a
 * diario— se edita en la ficha misma.
 */
export default function DatosDeLaMascota() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mascota = useMiMascota(id);
  const guardar = useGuardarDatosDeLaMascota(mascota.data);

  if (mascota.isPending) {
    return (
      <View style={{ padding: 24 }}>
        <SkeletonText lines={6} />
      </View>
    );
  }
  if (mascota.isError || !mascota.data) {
    return (
      <View style={{ padding: 24 }}>
        <InlineError title="No se pudo abrir la ficha" onRetry={() => mascota.refetch()} />
      </View>
    );
  }

  return (
    <DatosDeMiMascota
      mascota={mascota.data}
      enviando={guardar.isPending}
      error={guardar.isError ? mensajeDeError(guardar.error) : undefined}
      onGuardar={(cambios) => guardar.mutate(cambios, { onSuccess: () => router.back() })}
      onCancelar={() => router.back()}
    />
  );
}
