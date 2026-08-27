import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ANCHO_BORDE_FOCO, useTheme } from '../theme';

/**
 * Port a React Native de `design-system/components/core/Tabs.jsx`.
 *
 * En móvil la fila scrollea en horizontal en vez de recortarse: la paridad con
 * la web es de funcionalidad, y una pestaña inalcanzable la rompe.
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

export function Tabs<V extends string>({
  items,
  value,
  onChange,
  variant = 'underline',
  scrollable = false,
}: TabsProps<V>) {
  const { t, px, texto } = useTheme();
  const [enfocado, setEnfocado] = useState<string | null>(null);
  const pastilla = variant === 'pill';

  const fila = (
    <View
      accessibilityRole="tablist"
      style={[
        estilos.fila,
        {
          gap: pastilla ? 4 : 24,
          padding: pastilla ? 4 : 0,
          borderRadius: pastilla ? px('--radius-pill') : 0,
          backgroundColor: pastilla ? t['--surface-sunken'] : 'transparent',
          borderBottomWidth: pastilla ? 0 : 1,
          borderBottomColor: t['--border-default'],
        },
      ]}
    >
      {items.map((item) => {
        const activo = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            onPress={() => onChange(item.value)}
            onFocus={() => setEnfocado(item.value)}
            onBlur={() => setEnfocado(null)}
            style={[
              estilos.tab,
              pastilla
                ? {
                    paddingVertical: 7,
                    paddingHorizontal: 16,
                    borderRadius: px('--radius-pill'),
                    backgroundColor: activo ? t['--surface-card'] : 'transparent',
                  }
                : {
                    paddingBottom: 12,
                    marginBottom: -1,
                    borderBottomWidth: 2,
                    borderBottomColor: activo ? t['--color-primary-strong'] : 'transparent',
                  },
              enfocado === item.value && {
                borderTopWidth: ANCHO_BORDE_FOCO,
                borderTopColor: t['--border-focus'],
              },
            ]}
          >
            <Text
              style={[
                texto('body'),
                { fontWeight: '600', color: activo ? t['--text-strong'] : t['--text-muted'] },
              ]}
            >
              {item.label}
            </Text>
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
      })}
    </View>
  );

  if (!scrollable) return fila;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {fila}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-end' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contador: { paddingVertical: 2, paddingHorizontal: 6 },
});
