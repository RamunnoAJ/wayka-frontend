import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

import { Button } from './Button';
import { Icon } from './Icon';

/**
 * Error dentro del bloque que falló — el resto de la pantalla sigue usable.
 * Port a React Native de `design-system/components/core/InlineError.jsx`.
 *
 * Para avisos efímeros va `Toast`, no esto (BRIEF, sección 5).
 */
interface InlineErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Alineado a la izquierda y sin padding vertical grande: para usar en un formulario. */
  compact?: boolean;
}

export function InlineError({
  title = 'No se pudo cargar esto',
  description,
  onRetry,
  retryLabel = 'Reintentar',
  compact = false,
}: InlineErrorProps) {
  const { t, px, texto } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        estilos.base,
        compact
          ? { alignItems: 'flex-start', paddingVertical: 12 }
          : {
              alignItems: 'center',
              paddingVertical: px('--space-9'),
              paddingHorizontal: px('--space-7'),
            },
      ]}
    >
      <View style={estilos.titulo}>
        <Icon name="alert-circle" size={16} color={t['--text-danger']} />
        <Text style={[texto('body-strong'), { color: t['--text-danger'] }]}>{title}</Text>
      </View>

      {description ? (
        <Text
          style={[
            texto('body'),
            { color: t['--text-muted'], maxWidth: 340, textAlign: compact ? 'left' : 'center' },
          ]}
        >
          {description}
        </Text>
      ) : null}

      {onRetry ? (
        <View style={{ marginTop: 4 }}>
          <Button size="sm" variant="secondary" onPress={onRetry}>
            {retryLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { gap: 6 },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
