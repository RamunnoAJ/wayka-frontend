import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useEntrada } from '../hooks';
import { duracion, sombra, useTheme } from '../theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { InlineError } from './InlineError';

/**
 * Confirmación de una acción que cambia algo y no se deshace sola.
 *
 * Es un diálogo y no una confirmación en la misma fila porque lo que se pide es
 * consentimiento explícito: una confirmación en línea aparece donde estaba el
 * botón, y el segundo toque cae en el mismo lugar que el primero.
 *
 * **El verbo lo pone quien lo usa, y nunca es "eliminar".** En este sistema toda
 * baja es lógica: el registro sigue existiendo, con su autoría y su rastro. Un
 * diálogo que dijera "¿eliminar?" prometería algo que no pasa, y el copy de la
 * UI no debería decir "eliminar" cuando el dato sigue estando.
 */
interface Props {
  /** La pregunta, con el nombre de lo que se toca. "¿Dar de baja a Ana Rossi?" */
  titulo: string;
  /** Qué pasa de verdad al confirmar, incluido lo que **no** pasa. */
  descripcion: string;
  /** El verbo de la acción, en el botón. "Dar de baja", "Quitar el acceso". */
  etiquetaConfirmar: string;
  etiquetaCancelar?: string;
  enviando?: boolean;
  /**
   * El error va **adentro** del diálogo. Mostrarlo detrás obligaría a cerrar el
   * diálogo para leerlo, y quien cierra no se entera de que la acción falló.
   */
  error?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function DialogoDeConfirmacion({
  titulo,
  descripcion,
  etiquetaConfirmar,
  etiquetaCancelar = 'Cancelar',
  enviando = false,
  error,
  onConfirmar,
  onCancelar,
}: Props) {
  const { t, px, texto } = useTheme();
  const entrada = useEntrada();

  return (
    // No se cierra solo al confirmar: cerrarlo desde adentro perdería el error si
    // la operación falla. Lo cierra quien lo usa, cuando salió bien.
    <Modal transparent visible animationType="none" onRequestClose={onCancelar}>
      <Animated.View
        entering={FadeIn.duration(duracion.normal.duration)}
        exiting={FadeOut.duration(duracion.fast.duration)}
        style={estilos.telon}
      >
        <Animated.View
          entering={entrada}
          accessibilityRole="alert"
          accessibilityViewIsModal
          style={[
            estilos.tarjeta,
            sombra('--shadow-lg'),
            {
              borderRadius: px('--radius-card'),
              backgroundColor: t['--surface-card'],
              borderColor: t['--border-default'],
              padding: px('--gutter-card'),
            },
          ]}
        >
          <View style={estilos.encabezado}>
            <Icon name="alert-triangle" color={t['--text-danger']} />
            <Text style={[texto('h4'), { color: t['--text-strong'], flex: 1 }]}>{titulo}</Text>
          </View>

          <Text style={[texto('body'), { color: t['--text-muted'] }]}>{descripcion}</Text>

          {error ? <InlineError compact title="No se pudo completar" description={error} /> : null}

          <View style={estilos.acciones}>
            {/*
              Cancelar va primero y es el que queda a mano: la acción segura es
              la que se toca sin pensar, y en un diálogo destructivo la que se
              toca sin pensar tiene que ser la que no rompe nada.
            */}
            <Button variant="secondary" disabled={enviando} onPress={onCancelar}>
              {etiquetaCancelar}
            </Button>
            <Button variant="danger" loading={enviando} onPress={onConfirmar}>
              {etiquetaConfirmar}
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  telon: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tarjeta: { borderWidth: 1, gap: 14, width: '100%', maxWidth: 460 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 },
});
