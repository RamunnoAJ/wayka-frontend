import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ANCHO_BORDE_FOCO, colorDeFoco, useTheme } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

/**
 * Port a React Native de `design-system/components/navigation/SidebarNav.jsx`.
 *
 * Va sobre superficie oscura (`--surface-nav`), así que el foco se dibuja en
 * blanco: el borde de foco por defecto no se ve contra el lila oscuro.
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

export function SidebarNav({ items, value, onChange, clinic, user, onSalir }: SidebarNavProps) {
  const { t, px, texto } = useTheme();
  const [enfocado, setEnfocado] = useState<string | null>(null);
  const [sobrevolado, setSobrevolado] = useState<string | null>(null);

  return (
    <View
      accessibilityRole="menu"
      style={[estilos.base, { width: px('--sidebar-w'), backgroundColor: t['--surface-nav'] }]}
    >
      <View style={estilos.marca}>
        <Text style={[texto('h3'), { color: t['--text-on-nav'] }]}>Wayka</Text>
        {clinic ? (
          <Text style={[texto('caption'), { color: t['--text-on-nav-muted'], marginTop: 8 }]}>
            {clinic}
          </Text>
        ) : null}
      </View>

      <View style={estilos.items}>
        {items.map((item) => {
          const activo = item.value === value;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: activo }}
              onPress={() => onChange(item.value)}
              onFocus={() => setEnfocado(item.value)}
              onBlur={() => setEnfocado(null)}
              onHoverIn={() => setSobrevolado(item.value)}
              onHoverOut={() => setSobrevolado(null)}
              style={[
                estilos.item,
                {
                  borderRadius: px('--radius-control'),
                  backgroundColor: activo
                    ? t['--surface-nav-item']
                    : sobrevolado === item.value
                      ? t['--surface-nav-item-hover']
                      : 'transparent',
                  borderWidth: enfocado === item.value ? ANCHO_BORDE_FOCO : 0,
                  borderColor: colorDeFoco(t['--border-focus'], true),
                },
              ]}
            >
              <Icon
                name={item.icon}
                size={18}
                color={activo ? t['--text-on-nav'] : t['--text-on-nav-muted']}
              />
              <Text
                style={[
                  texto('body'),
                  {
                    flex: 1,
                    fontWeight: activo ? '600' : '500',
                    color: activo ? t['--text-on-nav'] : t['--text-on-nav-muted'],
                  },
                ]}
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
                  <Text
                    style={[
                      texto('overline'),
                      { fontWeight: '700', color: t['--surface-nav-deep'] },
                    ]}
                  >
                    {item.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {user ? (
        <View style={[estilos.usuario, { borderTopColor: t['--border-on-nav'] }]}>
          <View style={[estilos.avatar, { backgroundColor: t['--surface-nav-item'] }]}>
            <Text style={[texto('caption'), { fontWeight: '700', color: t['--text-on-nav'] }]}>
              {iniciales(user.name)}
            </Text>
          </View>
          <View style={estilos.datos}>
            <Text
              numberOfLines={1}
              style={[texto('body-sm'), { fontWeight: '600', color: t['--text-on-nav'] }]}
            >
              {user.name}
            </Text>
            <Text
              numberOfLines={1}
              style={[texto('overline'), { color: t['--text-on-nav-muted'] }]}
            >
              {user.role}
            </Text>
          </View>
          {onSalir ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              onPress={onSalir}
              style={estilos.salir}
            >
              <Icon name="log-out" size={18} color={t['--text-on-nav-muted']} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
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
