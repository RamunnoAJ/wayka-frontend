import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePresion } from '../hooks';
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
  /**
   * Cuántas cosas esperan en ese destino. Un punto sin número diría que hay
   * algo sin decir cuánto, y el número es justamente lo que decide si vale la
   * pena entrar ahora. Cero o ausente no dibuja nada.
   */
  pendientes?: number;
}

interface MobileTabBarProps {
  items: ItemDeTabBar[];
  value?: string;
  onChange: (valor: string) => void;
}

export function MobileTabBar({ items, value, onChange }: MobileTabBarProps) {
  const { t } = useTheme();
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
      {items.map((item) => (
        <ItemDeBarra
          key={item.value}
          item={item}
          activo={item.value === value}
          onPress={() => onChange(item.value)}
        />
      ))}
    </View>
  );
}

interface ItemDeBarraProps {
  item: ItemDeTabBar;
  activo: boolean;
  onPress: () => void;
}

/**
 * Un destino de la barra. Vive aparte por los hooks de animación, que no se
 * pueden llamar dentro del `map`.
 *
 * No hay indicador que viaje ni cruce de color: el destino se dice con el color
 * del ícono y de la etiqueta, y los dos tienen que cambiar juntos. El ícono es
 * un SVG de Lucide cuyo color es una prop, no un estilo, así que animarlo pide
 * `useAnimatedProps` por glifo; animar solo la etiqueta dejaría medio control
 * cruzando y la otra mitad saltando, que se lee peor que el salto entero.
 *
 * Un indicador que corriera de una pestaña a otra, además, competiría con el
 * cambio de pantalla que acaba de disparar el mismo toque.
 */
function ItemDeBarra({ item, activo, onPress }: ItemDeBarraProps) {
  const { t, texto } = useTheme();
  const presion = usePresion();
  const color = activo ? t['--color-primary-strong'] : t['--text-subtle'];

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      {...presion.gestos}
      style={estilos.item}
    >
      <Animated.View style={[estilos.contenido, presion.estilo]}>
        <View>
          <Icon name={item.icon} size={21} color={color} />
          {item.pendientes ? (
            <View
              style={[
                estilos.pendientes,
                { backgroundColor: t['--danger-500'], borderColor: t['--surface-card'] },
              ]}
            >
              <Text style={[texto('caption'), estilos.numero]}>
                {item.pendientes > 9 ? '9+' : String(item.pendientes)}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={[texto('overline'), { fontWeight: activo ? '600' : '500', color }]}
        >
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8, paddingHorizontal: 6 },
  item: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  contenido: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  // Encima del ícono y no al lado de la etiqueta: al lado empujaría el texto y
  // movería la pestaña entera cada vez que aparece o se va.
  pendientes: {
    position: 'absolute',
    top: -5,
    left: 12,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  numero: { color: '#fff', fontWeight: '700', lineHeight: 13 },
});
