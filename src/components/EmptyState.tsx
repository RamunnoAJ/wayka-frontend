import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

import { Icon, type NombreDeIcono } from './Icon';

/**
 * Port a React Native de `design-system/components/core/EmptyState.jsx`.
 *
 * El vacío de una sección clínica es información, no un hueco: dice qué falta y
 * cómo cargarlo.
 */
interface EmptyStateProps {
  icon?: NombreDeIcono;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'paw-print', title, description, action }: EmptyStateProps) {
  const { t, px, texto } = useTheme();

  return (
    <View
      style={[
        estilos.base,
        { paddingVertical: px('--space-10'), paddingHorizontal: px('--space-7') },
      ]}
    >
      <View
        style={[
          estilos.icono,
          { borderRadius: px('--radius-lg'), backgroundColor: t['--surface-accent-soft'] },
        ]}
      >
        <Icon name={icon} size={26} color={t['--color-primary-strong']} />
      </View>
      <Text style={[texto('h4'), { color: t['--text-strong'], textAlign: 'center' }]}>{title}</Text>
      {description ? (
        <Text
          style={[texto('body'), { color: t['--text-muted'], maxWidth: 360, textAlign: 'center' }]}
        >
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { alignItems: 'center', gap: 8 },
  icono: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
