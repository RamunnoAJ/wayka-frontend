import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, InlineError, SkeletonText } from '../../components';
import { useTheme } from '../../theme';
import { useAccesosDeMascota } from '../accesos/queries';

/**
 * Quiénes ven a esta mascota, en la ficha del veterinario.
 *
 * Los **tutores** con su contacto: antes había una sola persona por mascota y a
 * quién llamar era implícito; ahora no lo es.
 *
 * Las **otras clínicas**, solo con el nombre. Es continuidad de cuidado —no
 * repetir una vacuna que puso otra— y no una ventana a la cartera ajena.
 */
export function QuienesLaVen({
  pacienteId,
  nombreDelDueno,
  contactoDelDueno,
  clinicaPropiaID,
}: {
  pacienteId: string;
  nombreDelDueno?: string;
  contactoDelDueno?: string;
  clinicaPropiaID?: string;
}) {
  const { t, px, texto } = useTheme();
  const accesos = useAccesosDeMascota(pacienteId);

  const otrasClinicas = (accesos.data?.clinicas ?? []).filter(
    (clinica) => clinica.clinica_id !== clinicaPropiaID,
  );

  const tarjeta = {
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
    padding: px('--gutter-card'),
  };

  if (accesos.isPending) {
    return (
      <View style={tarjeta}>
        <SkeletonText lines={2} />
      </View>
    );
  }
  if (accesos.isError) {
    return (
      <View style={tarjeta}>
        <InlineError compact title="No se pudo cargar quiénes la ven" />
      </View>
    );
  }

  return (
    <View style={[tarjeta, estilos.bloque]}>
      <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
        QUIÉNES LA VEN
      </Text>

      <View style={estilos.lista}>
        {nombreDelDueno ? (
          <View style={estilos.fila}>
            <Avatar name={nombreDelDueno} size="sm" tone="brand" />
            <View style={estilos.flexible}>
              <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                {nombreDelDueno}
              </Text>
              {contactoDelDueno ? (
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  {contactoDelDueno}
                </Text>
              ) : null}
            </View>
            <Badge tone="primary">Dueño</Badge>
          </View>
        ) : null}

        {accesos.data?.co_tutores.map((coTutor) => (
          <View key={coTutor.tutor_id} style={estilos.fila}>
            <Avatar name={coTutor.nombre} size="sm" />
            <View style={estilos.flexible}>
              <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                {coTutor.nombre}
              </Text>
              {coTutor.contacto ? (
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  {coTutor.contacto}
                </Text>
              ) : null}
            </View>
            <Badge tone="neutral">
              {coTutor.nivel === 'edicion' ? 'Puede editar' : 'Solo mira'}
            </Badge>
          </View>
        ))}
      </View>

      {otrasClinicas.length > 0 ? (
        <View style={estilos.bloque}>
          <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>También la atienden</Text>
          <View style={estilos.chips}>
            {otrasClinicas.map((clinica) => (
              <Badge key={clinica.clinica_id} tone="info">
                {clinica.nombre}
              </Badge>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 10 },
  lista: { gap: 10 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flexible: { flex: 1, minWidth: 100, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
