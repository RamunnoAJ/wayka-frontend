import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Button, InlineError, Input } from '../../components';
import { useEntrada } from '../../hooks';
import { duracion, sombra, useTheme } from '../../theme';

/**
 * Cambiar el nombre con el que se ve un archivo.
 *
 * Es un diálogo y no una edición en la propia fila porque la fila es angosta y
 * el nombre es lo único que hay para reconocer el archivo: reemplazarlo por un
 * campo mientras se escribe deja al usuario sin la referencia de lo que estaba
 * cambiando.
 *
 * **La extensión no se muestra ni se pide**: la conserva el backend (Reglas de
 * Negocio, 4.14). Que el tutor tenga que escribir ".png" para que el archivo
 * siga abriéndose sería trasladarle una regla del sistema de archivos.
 */
interface Props {
  /** Nombre vigente, que es con lo que arranca el campo. */
  nombre: string;
  enviando?: boolean;
  /** Va adentro: cerrar para leerlo dejaría al usuario sin saber que falló. */
  error?: string;
  onGuardar: (nombre: string) => void;
  onCancelar: () => void;
}

/** El mismo techo que declara el contrato para `nombre_archivo`. */
const LARGO_MAXIMO = 120;

export function DialogoDeRenombre({
  nombre,
  enviando = false,
  error,
  onGuardar,
  onCancelar,
}: Props) {
  const { t, px, texto } = useTheme();
  const entrada = useEntrada();
  const [valor, setValor] = useState(sinExtension(nombre));

  const limpio = valor.trim();

  return (
    <Modal transparent visible animationType="none" onRequestClose={onCancelar}>
      <Animated.View
        entering={FadeIn.duration(duracion.normal.duration)}
        exiting={FadeOut.duration(duracion.fast.duration)}
        style={estilos.telon}
      >
        <Animated.View
          entering={entrada}
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
          <Text style={[texto('h4'), { color: t['--text-strong'] }]}>Cambiar el nombre</Text>
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            Es cómo se va a ver en la lista y cómo se va a llamar al descargarlo.
          </Text>

          <Input
            label="Nombre"
            value={valor}
            onChangeText={setValor}
            maxLength={LARGO_MAXIMO}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={() => limpio && onGuardar(limpio)}
          />

          {error ? <InlineError compact title="No se pudo renombrar" description={error} /> : null}

          <View style={estilos.acciones}>
            <Button variant="secondary" disabled={enviando} onPress={onCancelar}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={enviando}
              disabled={limpio === ''}
              onPress={() => onGuardar(limpio)}
            >
              Guardar
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * El campo arranca sin la extensión: es un dato del archivo y no del nombre que
 * el usuario elige, y dejarla adentro invita a borrarla sin querer. La vuelve a
 * poner el backend.
 */
function sinExtension(nombre: string): string {
  const punto = nombre.lastIndexOf('.');
  return punto > 0 ? nombre.slice(0, punto) : nombre;
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
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 },
});
