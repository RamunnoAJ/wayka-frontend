import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useEntrada } from '../hooks';

/**
 * Envoltorio de la entrada de una pantalla: el contenido aparece y sube 6 px
 * hasta su sitio.
 *
 * Va **una vez por pantalla y alrededor del contenido entero**, no elemento por
 * elemento: una lista donde cada fila entra por su cuenta se lee como una
 * pantalla que tarda, no como una que llega.
 *
 * Si la pantalla separa encabezado de cuerpo se usan dos, el segundo con
 * `ESCALON_MS`. Nunca un tercero: ahí ya es una espera.
 *
 * Entra al montarse, así que en un stack la pantalla nueva se anima y la que
 * queda atrás no se vuelve a animar al volver — que es lo correcto: volver no
 * es llegar a un lugar nuevo.
 */
interface EntradaDePantallaProps {
  children: ReactNode;
  /** Milisegundos antes de arrancar. `ESCALON_MS` para el segundo bloque. */
  retraso?: number;
  style?: StyleProp<ViewStyle>;
}

export function EntradaDePantalla({ children, retraso, style }: EntradaDePantallaProps) {
  const entrada = useEntrada(retraso);
  return (
    <Animated.View entering={entrada} style={[estilos.raiz, style]}>
      {children}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({ raiz: { flex: 1 } });
