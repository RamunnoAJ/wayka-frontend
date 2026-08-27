import { StyleSheet, Text, View } from 'react-native';

import { useTheme, type Tokens } from '../theme';

/**
 * Port a React Native de `design-system/components/clinical/StatusDot.jsx`.
 *
 * El color no es el único portador del estado: siempre va acompañado del texto
 * de `label`.
 */
type Estado = 'pendiente' | 'cumplido' | 'vencido' | 'activo' | 'inactivo';

function color(t: Tokens, estado: Estado): string {
  const tabla: Record<Estado, string> = {
    pendiente: t['--appt-pending'],
    cumplido: t['--appt-done'],
    vencido: t['--appt-overdue'],
    activo: t['--success-500'],
    inactivo: t['--neutral-300'],
  };
  return tabla[estado];
}

interface StatusDotProps {
  status?: Estado;
  label: string;
  size?: number;
}

export function StatusDot({ status = 'pendiente', label, size = 8 }: StatusDotProps) {
  const { t, texto } = useTheme();
  return (
    <View style={estilos.base}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color(t, status),
        }}
      />
      <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{label}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
