import { StyleSheet, View } from 'react-native';

import { Skeleton, SkeletonText } from '../../components';
import { sombra, useTheme } from '../../theme';

/**
 * Carga con las medidas del contenido real: identidad, banda y timeline. Sin
 * spinner centrado — un spinner no dice qué está por aparecer, y cuando llegan
 * los datos el layout salta.
 */
export function EsqueletoDeFicha({ esMovil }: { esMovil: boolean }) {
  const { t, px } = useTheme();

  const tarjeta = {
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
    padding: px('--gutter-card'),
  };

  return (
    <View style={{ gap: px('--space-7') }}>
      <View style={[tarjeta, sombra('--shadow-sm'), estilos.identidad]}>
        <Skeleton width={80} height={80} />
        <View style={estilos.columna}>
          <Skeleton width="42%" height={26} />
          <Skeleton width="60%" height={14} />
          <View style={[estilos.stats, { flexDirection: esMovil ? 'column' : 'row' }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={estilos.flexible}>
                <Skeleton height={34} />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={[tarjeta, { borderColor: t['--border-strong'], gap: 14 }]}>
        <Skeleton width={140} height={11} />
        <View style={[estilos.banda, { flexDirection: esMovil ? 'column' : 'row' }]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={estilos.flexible}>
              <SkeletonText lines={3} />
            </View>
          ))}
        </View>
      </View>

      <View style={[tarjeta, { gap: 22 }]}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={estilos.evento}>
            <Skeleton height={34} circle />
            <View style={estilos.flexible}>
              <SkeletonText lines={2} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  identidad: { flexDirection: 'row', gap: 18 },
  columna: { flex: 1, gap: 10 },
  stats: { gap: 16, marginTop: 6 },
  banda: { gap: 20 },
  evento: { flexDirection: 'row', gap: 14 },
  flexible: { flex: 1 },
});
