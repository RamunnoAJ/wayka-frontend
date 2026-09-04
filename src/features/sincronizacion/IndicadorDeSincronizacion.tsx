import { StyleSheet, Text, View } from 'react-native';

import { Badge, Presionable } from '../../components';
import { hayCopiaLocal } from '../../lib/base-local';
import { useTheme } from '../../theme';

import { useEstadoDeSincronizacion } from './queries';

/**
 * Estado de la copia local, cuando hay algo que decir (doc 11, sección 7).
 *
 * **Estar al día no se muestra.** Un cartel verde permanente arriba de la lista
 * de mascotas ocupa lugar en la pantalla más usada de la app para decir que no
 * pasa nada; que la barra no esté significa que está todo enviado.
 *
 * Lo que sí se muestra son los dos estados que le piden algo al tutor: un cambio
 * pendiente que no apareciera haría que la app pareciera haber perdido lo que
 * acaba de escribir, y un rechazo invisible es un cambio que el tutor cree hecho
 * y no está.
 */
export function IndicadorDeSincronizacion({ onVerRechazos }: { onVerRechazos: () => void }) {
  const { t, px, texto } = useTheme();
  const estado = useEstadoDeSincronizacion();

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

  if (pendientes === 0) return null;

  return (
    <View style={[estilos.barra, estilos.sinBorde]}>
      <Badge tone="warning" icon="refresh-cw">
        {pendientes === 1 ? '1 cambio sin enviar' : `${pendientes} cambios sin enviar`}
      </Badge>
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
