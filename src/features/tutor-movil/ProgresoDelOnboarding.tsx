import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '../../components';
import { useTheme } from '../../theme';

/**
 * El progreso del alta de la primera mascota (Alcance de Plataformas, 5.2).
 *
 * **No arranca en cero.** El tutor ya se registró antes de llegar acá, y una
 * barra vacía le cobra ese paso de nuevo: empieza reconociéndolo, avanza en el
 * paso de antecedentes y cierra en el resumen.
 *
 * Los tres pasos están fijos y no se calculan: son los del onboarding, y un
 * cálculo sobre "cuántas pantallas faltan" cambiaría el porcentaje cada vez que
 * se agregue una.
 */
export const PASO_DEL_ONBOARDING = {
  /** Ya registrado, cargando los datos de la mascota. */
  DATOS: 33,
  /** La mascota existe; queda lo que trae de antes. */
  ANTECEDENTES: 66,
  /** La ficha está armada. */
  LISTO: 100,
} as const;

export type PasoDelOnboarding = (typeof PASO_DEL_ONBOARDING)[keyof typeof PASO_DEL_ONBOARDING];

export function ProgresoDelOnboarding({
  paso,
  leyenda,
}: {
  paso: PasoDelOnboarding;
  leyenda: string;
}) {
  const { t, texto } = useTheme();

  return (
    <View style={estilos.raiz}>
      <ProgressBar value={paso} size="sm" showValue={false} />
      {/* La leyenda es la que dice en qué punto está: la barra sola es una
          medida sin significado, y el porcentaje escrito al lado no agrega
          nada que el tutor esté por decidir. */}
      <Text style={[texto('caption'), { color: t['--text-muted'] }]}>{leyenda}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 6 },
});
