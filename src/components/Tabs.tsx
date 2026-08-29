import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutRectangle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTransicionDeControl } from '../hooks';
import { ANCHO_BORDE_FOCO, resorte, useTheme } from '../theme';

/**
 * Port a React Native de `design-system/components/core/Tabs.jsx`.
 *
 * En móvil la fila scrollea en horizontal en vez de recortarse: la paridad con
 * la web es de funcionalidad, y una pestaña inalcanzable la rompe.
 *
 * Lo que se mueve es el indicador, no las etiquetas: viaja de una pestaña a la
 * siguiente con `resorte.default`, mientras el color del texto cruza con timing
 * en paralelo. Los tres resortes del sistema están críticamente amortiguados,
 * así que el indicador no puede pasarse de la pestaña y volver.
 */
export interface ItemDeTab<V extends string = string> {
  value: V;
  label: string;
  /** Contador opcional. En 0 conviene omitirlo: un cero no aporta. */
  count?: number;
}

interface TabsProps<V extends string> {
  items: ItemDeTab<V>[];
  value: V;
  onChange: (valor: V) => void;
  variant?: 'underline' | 'pill';
  /** Envuelve la fila en un scroll horizontal (móvil). */
  scrollable?: boolean;
}

interface Medida {
  x: number;
  ancho: number;
}

export function Tabs<V extends string>({
  items,
  value,
  onChange,
  variant = 'underline',
  scrollable = false,
}: TabsProps<V>) {
  const { t, px } = useTheme();
  const [enfocado, setEnfocado] = useState<string | null>(null);
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const pastilla = variant === 'pill';

  const indice = items.findIndex((item) => item.value === value);
  const reducido = useReducedMotion();
  const x = useSharedValue(0);
  const ancho = useSharedValue(0);

  // El primer posicionamiento es una asignación y no un viaje: el indicador no
  // tiene de dónde venir todavía, y animarlo desde el borde izquierdo sería
  // inventarle un origen que no existe.
  const colocado = useRef(false);

  useEffect(() => {
    const medida = medidas[indice];
    if (!medida) return;
    const directo = reducido || !colocado.current;
    colocado.current = true;
    x.set(directo ? medida.x : withSpring(medida.x, resorte.default));
    ancho.set(directo ? medida.ancho : withSpring(medida.ancho, resorte.default));
  }, [indice, medidas, reducido, x, ancho]);

  const estiloIndicador = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
    width: ancho.get(),
    // Hasta que la primera medición llegue no hay dónde dibujarlo.
    opacity: ancho.get() === 0 ? 0 : 1,
  }));

  const medir = (posicion: number, layout: LayoutRectangle) => {
    setMedidas((previas) => {
      const actual = previas[posicion];
      if (actual && actual.x === layout.x && actual.ancho === layout.width) return previas;
      const siguientes = [...previas];
      siguientes[posicion] = { x: layout.x, ancho: layout.width };
      return siguientes;
    });
  };

  const fila = (
    <View
      accessibilityRole="tablist"
      style={[
        pastilla
          ? {
              padding: 4,
              borderRadius: px('--radius-pill'),
              backgroundColor: t['--surface-sunken'],
            }
          : { borderBottomWidth: 1, borderBottomColor: t['--border-default'] },
      ]}
    >
      {/* La fila interna no lleva padding: la medición de cada pestaña y la
          posición del indicador se leen desde el mismo origen. */}
      <View style={[estilos.fila, { gap: pastilla ? 4 : 24 }]}>
        <Animated.View
          pointerEvents="none"
          style={[
            pastilla
              ? {
                  top: 0,
                  bottom: 0,
                  borderRadius: px('--radius-pill'),
                  backgroundColor: t['--surface-card'],
                }
              : { bottom: -1, height: 2, backgroundColor: t['--color-primary-strong'] },
            estilos.indicador,
            estiloIndicador,
          ]}
        />

        {items.map((item, posicion) => (
          <Tab
            key={item.value}
            item={item}
            activo={item.value === value}
            pastilla={pastilla}
            enfocado={enfocado === item.value}
            onLayout={(layout) => medir(posicion, layout)}
            onPress={() => onChange(item.value)}
            onFocus={() => setEnfocado(item.value)}
            onBlur={() => setEnfocado(null)}
          />
        ))}
      </View>
    </View>
  );

  if (!scrollable) return fila;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {fila}
    </ScrollView>
  );
}

interface TabProps {
  item: ItemDeTab;
  activo: boolean;
  pastilla: boolean;
  enfocado: boolean;
  onLayout: (layout: LayoutRectangle) => void;
  onPress: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * Una pestaña. Vive aparte porque el color de su etiqueta se anima con un hook,
 * y un hook no se puede llamar dentro del `map` de la fila.
 */
function Tab({ item, activo, pastilla, enfocado, onLayout, onPress, onFocus, onBlur }: TabProps) {
  const { t, px, texto } = useTheme();
  const color = useTransicionDeControl({
    color: activo ? t['--text-strong'] : t['--text-muted'],
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      onLayout={(evento) => onLayout(evento.nativeEvent.layout)}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      style={[
        estilos.tab,
        pastilla
          ? { paddingVertical: 7, paddingHorizontal: 16 }
          : // 14 = los 12 de padding más los 2 que antes ponía el borde de la
            // pestaña activa, que ahora dibuja el indicador.
            { paddingBottom: 14 },
        enfocado && { borderTopWidth: ANCHO_BORDE_FOCO, borderTopColor: t['--border-focus'] },
      ]}
    >
      <Animated.Text style={[texto('body'), estilos.etiqueta, color]}>{item.label}</Animated.Text>
      {item.count != null ? (
        <View
          style={[
            estilos.contador,
            { borderRadius: px('--radius-pill'), backgroundColor: t['--neutral-100'] },
          ]}
        >
          <Text style={[texto('overline'), { fontWeight: '600', color: t['--text-muted'] }]}>
            {item.count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-end', position: 'relative' },
  indicador: { position: 'absolute', left: 0 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  etiqueta: { fontWeight: '600' },
  contador: { paddingVertical: 2, paddingHorizontal: 6 },
});
