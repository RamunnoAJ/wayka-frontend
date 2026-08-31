import { StyleSheet, Text, View } from 'react-native';

import { Badge, Presionable } from '../../components';
import { hayCopiaLocal } from '../../lib/base-local';
import { useTheme } from '../../theme';

import { useEstadoDeSincronizacion, useSincronizar } from './queries';

/**
 * Estado de la copia local, siempre visible (doc 11, sección 7).
 *
 * Los tres estados que el tutor puede tener —sincronizado, pendiente,
 * rechazado— se muestran; ninguno se esconde. Un cambio pendiente que no
 * apareciera haría que la app pareciera haber perdido lo que acaba de escribir,
 * y un rechazo invisible es un cambio que el tutor cree hecho y no está.
 */
export function IndicadorDeSincronizacion({ onVerRechazos }: { onVerRechazos: () => void }) {
  const { t, px, texto } = useTheme();
  const estado = useEstadoDeSincronizacion();
  const sincronizacion = useSincronizar();

  if (!hayCopiaLocal || !estado.data) return null;

  const { pendientes, rechazadas } = estado.data;

  if (rechazadas > 0) {
    return (
      <Presionable
        onPress={onVerRechazos}
        fondo={t['--surface-card']}
        fondoDestacado={t['--surface-hover']}
        borde={t['--border-danger']}
        style={[estilos.barra, { borderRadius: px('--radius-card') }]}
      >
        <Badge tone="danger" icon="alert-triangle">
          {rechazadas === 1 ? '1 cambio sin aplicar' : `${rechazadas} cambios sin aplicar`}
        </Badge>
        <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>Tocá para resolverlos</Text>
      </Presionable>
    );
  }

  return (
    <View style={[estilos.barra, estilos.sinBorde]}>
      {pendientes > 0 ? (
        <Badge tone="warning" icon="refresh-cw">
          {pendientes === 1 ? '1 cambio sin enviar' : `${pendientes} cambios sin enviar`}
        </Badge>
      ) : (
        <Badge tone="success" icon="check">
          {sincronizacion.isPending ? 'Sincronizando…' : 'Todo al día'}
        </Badge>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sinBorde: { paddingHorizontal: 0 },
});
