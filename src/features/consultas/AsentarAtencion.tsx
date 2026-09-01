import { StyleSheet, Text, View } from 'react-native';

import { ORIGEN_DE_CONSULTA, type OrigenDeConsulta } from '../../api/consulta';
import { Button, InlineError } from '../../components';
import { sombra, useTheme } from '../../theme';

import { useAsentarAtencion } from './queries';

/**
 * Asentar la atención que nadie agendó, desde la ficha de la mascota.
 *
 * Es el caso más frecuente de una veterinaria —entra alguien con el perro que se
 * cortó— y por eso no cuelga de la agenda: pedir que exista una cita para poder
 * registrar que se atendió obligaría a inventarla hacia atrás.
 *
 * Los dos orígenes son botones y no un selector: son dos, se eligen una vez y
 * cualquier paso intermedio convierte un toque en un formulario. La agendada no
 * está acá a propósito: esa se asienta desde su cita, que es donde se sabe cuál.
 */
interface AsentarAtencionProps {
  pacienteId: string;
  /** La ficha en solo lectura no asienta: no hay atención que registrar. */
  bloqueado: boolean;
  motivoBloqueo: string;
}

const ORIGENES: { origen: OrigenDeConsulta; etiqueta: string }[] = [
  { origen: ORIGEN_DE_CONSULTA.ESPONTANEA, etiqueta: 'Atendí sin turno' },
  { origen: ORIGEN_DE_CONSULTA.URGENCIA, etiqueta: 'Atendí una urgencia' },
];

export function AsentarAtencion({ pacienteId, bloqueado, motivoBloqueo }: AsentarAtencionProps) {
  const { t, px, texto } = useTheme();
  const asentar = useAsentarAtencion(pacienteId);

  return (
    <View
      style={[
        estilos.tarjeta,
        sombra('--shadow-sm'),
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
          padding: px('--gutter-card'),
        },
      ]}
    >
      <View style={estilos.texto}>
        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
          {asentar.isSuccess ? 'Atención asentada' : '¿La estás atendiendo ahora?'}
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          {asentar.isSuccess
            ? 'Queda en las atenciones de hoy hasta que le cargues el historial.'
            : 'Dejalo asentado y cargá el historial cuando puedas.'}
        </Text>
      </View>

      <View style={estilos.acciones}>
        {ORIGENES.map(({ origen, etiqueta }) => (
          <Button
            key={origen}
            variant="secondary"
            size="sm"
            disabled={bloqueado}
            loading={asentar.isPending}
            accessibilityLabel={bloqueado ? motivoBloqueo : etiqueta}
            onPress={() => asentar.mutate({ origen })}
          >
            {etiqueta}
          </Button>
        ))}
      </View>

      {asentar.isError ? <InlineError title="No se pudo asentar la atención." compact /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  texto: { gap: 2, flexGrow: 1, flexShrink: 1, minWidth: 200 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
