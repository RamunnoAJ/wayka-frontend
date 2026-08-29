import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePresion, useTransicionDeControl } from '../hooks';
import { ANCHO_BORDE_FOCO, colorDeFoco, ESCALA_DE_PRESION_LG, useTheme } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

/**
 * Port a React Native de `design-system/components/navigation/SidebarNav.jsx`.
 *
 * Va sobre `--surface-nav`, que es oscura en clínica y el naranja claro de marca
 * en el tutor (design system 1.5.0). En las dos el contenido es blanco, así que
 * el foco también: el borde por defecto no se ve contra ninguna de las dos.
 */
export interface ItemDeSidebar {
  value: string;
  label: string;
  icon: NombreDeIcono;
  badge?: number;
}

interface SidebarNavProps {
  items: ItemDeSidebar[];
  value?: string;
  onChange: (valor: string) => void;
  /** Nombre de la clínica, bajo el logo. */
  clinic?: string;
  user?: { name: string; role: string };
  /** Acción del pie: hoy, cerrar sesión. */
  onSalir?: () => void;
  /** Cierre de sesión en curso: bloquea el botón y muestra el spinner. */
  salidaEnCurso?: boolean;
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase();
}

export function SidebarNav({
  items,
  value,
  onChange,
  clinic,
  user,
  onSalir,
  salidaEnCurso,
}: SidebarNavProps) {
  const { t, px, textoSobreMarca } = useTheme();
  const [enfocado, setEnfocado] = useState<string | null>(null);
  const [sobrevolado, setSobrevolado] = useState<string | null>(null);

  return (
    <View
      accessibilityRole="menu"
      style={[estilos.base, { width: px('--sidebar-w'), backgroundColor: t['--surface-nav'] }]}
    >
      <View style={estilos.marca}>
        <Text style={[textoSobreMarca('h3'), { color: t['--text-on-nav'] }]}>Wayka</Text>
        {clinic ? (
          <Text
            style={[textoSobreMarca('caption'), { color: t['--text-on-nav-muted'], marginTop: 8 }]}
          >
            {clinic}
          </Text>
        ) : null}
      </View>

      <View style={estilos.items}>
        {items.map((item) => (
          <ItemDeNavegacion
            key={item.value}
            item={item}
            activo={item.value === value}
            enfocado={enfocado === item.value}
            sobrevolado={sobrevolado === item.value}
            onPress={() => onChange(item.value)}
            onFocus={() => setEnfocado(item.value)}
            onBlur={() => setEnfocado(null)}
            onHoverIn={() => setSobrevolado(item.value)}
            onHoverOut={() => setSobrevolado(null)}
          />
        ))}
      </View>

      {user ? (
        <View style={[estilos.usuario, { borderTopColor: t['--border-on-nav'] }]}>
          <View style={[estilos.avatar, { backgroundColor: t['--surface-nav-item'] }]}>
            <Text
              style={[textoSobreMarca('caption'), { fontWeight: '700', color: t['--text-on-nav'] }]}
            >
              {iniciales(user.name)}
            </Text>
          </View>
          <View style={estilos.datos}>
            <Text
              numberOfLines={1}
              style={[textoSobreMarca('body-sm'), { fontWeight: '600', color: t['--text-on-nav'] }]}
            >
              {user.name}
            </Text>
            <Text
              numberOfLines={1}
              style={[textoSobreMarca('overline'), { color: t['--text-on-nav-muted'] }]}
            >
              {user.role}
            </Text>
          </View>
          {onSalir ? (
            // Deshabilitado mientras cierra: la mutación revoca el token de
            // refresco, y un segundo disparo revocaría uno que ya no vale.
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              accessibilityState={{ disabled: salidaEnCurso, busy: salidaEnCurso }}
              disabled={salidaEnCurso}
              onPress={onSalir}
              style={estilos.salir}
            >
              {salidaEnCurso ? (
                <ActivityIndicator size="small" color={t['--text-on-nav-muted']} />
              ) : (
                <Icon name="log-out" size={18} color={t['--text-on-nav-muted']} />
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

interface ItemDeNavegacionProps {
  item: ItemDeSidebar;
  activo: boolean;
  enfocado: boolean;
  sobrevolado: boolean;
  onPress: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onHoverIn: () => void;
  onHoverOut: () => void;
}

/**
 * Un destino de la navegación. Vive aparte por los hooks de animación, que no
 * se pueden llamar dentro del `map`.
 *
 * Se anima el fondo del ítem, que es la afordancia principal, y no el color del
 * ícono ni el de la etiqueta: el ícono es un SVG cuyo color es una prop y no un
 * estilo, y cruzar solo el texto dejaría los dos desincronizados.
 *
 * La escala del press es la grande: es una fila ancha, y el factor chico ahí se
 * lee como un salto.
 */
function ItemDeNavegacion({
  item,
  activo,
  enfocado,
  sobrevolado,
  onPress,
  onFocus,
  onBlur,
  onHoverIn,
  onHoverOut,
}: ItemDeNavegacionProps) {
  const { t, px, texto, textoSobreMarca } = useTheme();
  const presion = usePresion(ESCALA_DE_PRESION_LG);
  const color = activo ? t['--text-on-nav'] : t['--text-on-nav-muted'];
  const fondo = useTransicionDeControl({
    backgroundColor: activo
      ? t['--surface-nav-item']
      : sobrevolado
        ? t['--surface-nav-item-hover']
        : 'transparent',
  });

  return (
    <PressableAnimado
      accessibilityRole="menuitem"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      {...presion.gestos}
      style={[
        estilos.item,
        {
          borderRadius: px('--radius-control'),
          borderWidth: enfocado ? ANCHO_BORDE_FOCO : 0,
          borderColor: colorDeFoco(t['--border-focus'], true),
        },
        fondo,
        presion.estilo,
      ]}
    >
      <Icon name={item.icon} size={18} color={color} />
      <Text
        style={[textoSobreMarca('body'), { flex: 1, fontWeight: activo ? '600' : '500', color }]}
      >
        {item.label}
      </Text>
      {item.badge != null ? (
        <View
          style={[
            estilos.badge,
            { borderRadius: px('--radius-pill'), backgroundColor: t['--nav-accent'] },
          ]}
        >
          <Text style={[texto('overline'), { fontWeight: '700', color: t['--nav-accent-fg'] }]}>
            {item.badge}
          </Text>
        </View>
      ) : null}
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  base: { flexGrow: 0, flexShrink: 0, height: '100%', paddingVertical: 22, paddingHorizontal: 14 },
  marca: { paddingHorizontal: 8, paddingBottom: 22 },
  items: { flex: 1, gap: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  badge: { paddingVertical: 1, paddingHorizontal: 7 },
  usuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datos: { flex: 1, minWidth: 0 },
  salir: { padding: 4 },
});
