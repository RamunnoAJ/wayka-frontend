import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

/**
 * Port a React Native de `design-system/components/navigation/MobileTabBar.jsx`.
 *
 * El original reserva el área segura con `env(safe-area-inset-bottom)`, que no
 * existe en nativo: acá se toma del contexto de área segura.
 */
export interface ItemDeTabBar {
  value: string;
  label: string;
  icon: NombreDeIcono;
}

interface MobileTabBarProps {
  items: ItemDeTabBar[];
  value?: string;
  onChange: (valor: string) => void;
}

export function MobileTabBar({ items, value, onChange }: MobileTabBarProps) {
  const { t, texto } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        estilos.base,
        {
          backgroundColor: t['--surface-card'],
          borderTopColor: t['--border-default'],
          paddingBottom: 8 + insets.bottom,
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
            style={estilos.item}
          >
            <Icon
              name={item.icon}
              size={21}
              color={activo ? t['--color-primary-strong'] : t['--text-subtle']}
            />
            <Text
              numberOfLines={1}
              style={[
                texto('overline'),
                {
                  fontWeight: activo ? '600' : '500',
                  color: activo ? t['--color-primary-strong'] : t['--text-subtle'],
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8, paddingHorizontal: 6 },
  item: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 3 },
});
