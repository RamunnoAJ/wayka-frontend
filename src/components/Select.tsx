import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useEntrada, usePresion, useTransicionDeControl } from '../hooks';
import { ANCHO_BORDE_FOCO, duracion, sombra, useTheme } from '../theme';

import { Icon } from './Icon';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

/**
 * Port a React Native de `design-system/components/core/Select.jsx`.
 *
 * El original es un `<select>` nativo del navegador, que no existe en iOS ni en
 * Android: acá el desplegable es una lista propia en un `Modal`. La API pública
 * y la apariencia del control cerrado se mantienen — la paridad es de
 * funcionalidad, no de implementación.
 */
export interface OpcionDeSelect<V extends string = string> {
  value: V;
  label: string;
}

interface SelectProps<V extends string> {
  label?: string;
  options: OpcionDeSelect<V>[];
  value: V;
  onChange: (valor: V) => void;
  hint?: string;
  /** Nombre accesible cuando no hay `label` visible. */
  accessibilityLabel?: string;
}

export function Select<V extends string>({
  label,
  options,
  value,
  onChange,
  hint,
  accessibilityLabel,
}: SelectProps<V>) {
  const { t, px, texto } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const [enfocado, setEnfocado] = useState(false);

  const presion = usePresion();
  const entrada = useEntrada();
  const colores = useTransicionDeControl({
    borderColor: enfocado ? t['--border-focus'] : t['--border-default'],
  });

  const seleccionada = options.find((o) => o.value === value);

  return (
    <View style={estilos.contenedor}>
      {label ? <Text style={[texto('caption'), { color: t['--text-muted'] }]}>{label}</Text> : null}

      <PressableAnimado
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityValue={{ text: seleccionada?.label }}
        accessibilityState={{ expanded: abierto }}
        onPress={() => setAbierto(true)}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        {...presion.gestos}
        style={[
          estilos.control,
          {
            height: px('--control-h-md'),
            borderRadius: px('--radius-control'),
            backgroundColor: t['--surface-card'],
            borderWidth: enfocado ? ANCHO_BORDE_FOCO : 1,
          },
          colores,
          presion.estilo,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[texto('body'), estilos.valor, { color: t['--text-strong'] }]}
        >
          {seleccionada?.label ?? ''}
        </Text>
        <Icon name="chevron-down" size={16} color={t['--text-subtle']} />
      </PressableAnimado>

      {hint ? <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>{hint}</Text> : null}

      {/* `animationType="none"`: la entrada la pone el sistema de movimiento, no
          la del sistema operativo. El telón cruza con timing (es opacidad) y el
          panel entra con el resorte suave, igual que una pantalla. */}
      <Modal
        visible={abierto}
        transparent
        animationType="none"
        onRequestClose={() => setAbierto(false)}
      >
        <PressableAnimado
          entering={FadeIn.duration(duracion.normal.duration)}
          exiting={FadeOut.duration(duracion.fast.duration)}
          style={estilos.telon}
          onPress={() => setAbierto(false)}
        >
          <Animated.View
            entering={entrada}
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
            <ScrollView>
              {options.map((opcion) => {
                const activa = opcion.value === value;
                return (
                  <Pressable
                    key={opcion.value}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: activa }}
                    onPress={() => {
                      onChange(opcion.value);
                      setAbierto(false);
                    }}
                    style={({ hovered, pressed }) => [
                      estilos.opcion,
                      {
                        backgroundColor: activa
                          ? t['--surface-selected']
                          : hovered || pressed
                            ? t['--surface-hover']
                            : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        texto('body'),
                        { color: activa ? t['--text-strong'] : t['--text-body'], flex: 1 },
                      ]}
                    >
                      {opcion.label}
                    </Text>
                    {activa ? (
                      <Icon name="check" size={16} color={t['--color-primary-strong']} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </PressableAnimado>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 6, width: '100%' },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  valor: { flex: 1 },
  telon: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  panel: { width: '100%', maxWidth: 360, maxHeight: 420, borderWidth: 1, overflow: 'hidden' },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
