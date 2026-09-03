import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

import { Icon } from './Icon';

/**
 * Port a React Native de `design-system/components/clinical/MedicationItem.jsx`.
 *
 * `status="finalizado"` baja la opacidad y tacha la droga: un tratamiento
 * cerrado sigue siendo historia clínica y no se oculta.
 */
interface MedicationItemProps {
  name: string;
  /**
   * Opcional porque una medicación que declaró el tutor puede no traerla: el
   * dueño sabe qué le da al animal y a veces nada más que eso. Sin dosis la
   * línea no queda coja ni miente con un guion — simplemente no la escribe.
   */
  dose?: string | null;
  frequency?: string | null;
  /** Fecha de cierre, ya formateada. */
  until?: string;
  /** Línea secundaria: desde cuándo y quién lo indicó. */
  prescriber?: string;
  status?: 'activo' | 'finalizado';
  /** Marca de origen, cuando el registro no lo escribió un profesional. */
  badge?: ReactNode;
  action?: ReactNode;
}

export function MedicationItem({
  name,
  dose,
  frequency,
  until,
  prescriber,
  status = 'activo',
  badge,
  action,
}: MedicationItemProps) {
  const { t, px, texto } = useTheme();
  const cerrada = status !== 'activo';

  const secundaria = [frequency, until && `hasta ${until}`, prescriber].filter(Boolean).join(' · ');

  return (
    <View
      style={[
        estilos.base,
        {
          borderRadius: px('--radius-md'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-subtle'],
          opacity: cerrada ? 0.62 : 1,
        },
      ]}
    >
      <View
        style={[
          estilos.icono,
          {
            borderRadius: px('--radius-sm'),
            backgroundColor: cerrada ? t['--neutral-100'] : t['--color-primary-soft'],
          },
        ]}
      >
        <Icon
          name="pill"
          size={16}
          color={cerrada ? t['--text-subtle'] : t['--color-primary-strong']}
        />
      </View>

      <View style={estilos.cuerpo}>
        <View style={estilos.titulo}>
          <Text
            style={[
              texto('body-strong'),
              {
                color: t['--text-strong'],
                textDecorationLine: cerrada ? 'line-through' : 'none',
              },
            ]}
          >
            {name}
          </Text>
          {dose ? (
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{dose}</Text>
          ) : null}
          {badge}
        </View>
        {secundaria ? (
          <Text style={[texto('caption'), { color: t['--text-subtle'], marginTop: 2 }]}>
            {secundaria}
          </Text>
        ) : null}
      </View>

      {action}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  icono: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  cuerpo: { flex: 1, minWidth: 0 },
  titulo: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
});
