import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useEntrada } from '../hooks';
import { duracion, sombra, useTheme } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';
import { IconButton } from './IconButton';

/**
 * Menú de acciones de una fila, detrás de un botón de tres puntos.
 *
 * Existe porque una fila con dos o tres botones a la vista los pone al mismo
 * peso visual que el contenido, y con una acción destructiva entre ellos la
 * cercanía es el problema: se apunta a una y se toca la otra.
 *
 * El desplegable es un `Modal` propio y no un `<menu>` del navegador, con el
 * mismo criterio que `Select`: el elemento nativo no existe en iOS ni en
 * Android, y este componente compila a los tres targets.
 */
export interface AccionDeMenu {
  label: string;
  icono?: NombreDeIcono;
  onPress: () => void;
  /** Marca la acción que destruye algo, para que no se lea igual que el resto. */
  peligro?: boolean;
  deshabilitada?: boolean;
}

interface Props {
  acciones: AccionDeMenu[];
  /**
   * Nombre accesible del disparador. Nombra a qué fila pertenece —"Acciones de
   * Ana Rossi"— porque un listado tiene uno por fila y "Acciones" a secas los
   * deja a todos con el mismo nombre.
   */
  accessibilityLabel: string;
}

export function MenuDeAcciones({ acciones, accessibilityLabel }: Props) {
  const { t, px, texto } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const entrada = useEntrada();

  return (
    <View>
      <IconButton
        icon="ellipsis-vertical"
        label={accessibilityLabel}
        size="sm"
        variant="ghost"
        onPress={() => setAbierto(true)}
      />

      <Modal
        visible={abierto}
        transparent
        animationType="none"
        onRequestClose={() => setAbierto(false)}
      >
        {/* El telón cierra al tocar afuera, que es como se sale de un menú sin
            elegir nada. */}
        <AnimatedPressable
          entering={FadeIn.duration(duracion.normal.duration)}
          exiting={FadeOut.duration(duracion.fast.duration)}
          style={estilos.telon}
          accessibilityLabel="Cerrar el menú"
          onPress={() => setAbierto(false)}
        >
          <Animated.View
            entering={entrada}
            accessibilityRole="menu"
            style={[
              estilos.panel,
              sombra('--shadow-lg'),
              {
                borderRadius: px('--radius-card'),
                backgroundColor: t['--surface-card'],
                borderColor: t['--border-default'],
              },
            ]}
          >
            {acciones.map((accion) => (
              <Pressable
                key={accion.label}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled: accion.deshabilitada }}
                disabled={accion.deshabilitada}
                onPress={() => {
                  // Se cierra antes de ejecutar: varias de estas acciones abren
                  // otra cosa —una confirmación, otra pantalla— y el menú abierto
                  // encima taparía justo lo que acaba de aparecer.
                  setAbierto(false);
                  accion.onPress();
                }}
                style={({ hovered, pressed }) => [
                  estilos.opcion,
                  {
                    backgroundColor: hovered || pressed ? t['--surface-hover'] : 'transparent',
                    opacity: accion.deshabilitada ? 0.5 : 1,
                  },
                ]}
              >
                {accion.icono ? (
                  <Icon
                    name={accion.icono}
                    size={16}
                    color={accion.peligro ? t['--text-danger'] : t['--text-subtle']}
                  />
                ) : null}
                <Text
                  style={[
                    texto('body'),
                    { color: accion.peligro ? t['--text-danger'] : t['--text-body'], flex: 1 },
                  ]}
                >
                  {accion.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        </AnimatedPressable>
      </Modal>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const estilos = StyleSheet.create({
  telon: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  panel: { borderWidth: 1, minWidth: 240, maxWidth: 360, paddingVertical: 6, overflow: 'hidden' },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
