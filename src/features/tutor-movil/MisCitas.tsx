import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ESTADO_DE_CITA, esReagendable, type EstadoDeCita, type TipoDeCita } from '../../api/cita';
import { EmptyState, InlineError, SkeletonText, StatusDot } from '../../components';
import { sombra, useTheme, type Tokens } from '../../theme';
import { diaDeInstante, fechaCorta, horaCorta } from '../paciente/formato';

import { useMisCitas, useMisMascotas } from './queries';

/**
 * Mis citas (Alcance de Plataformas, 5.4).
 *
 * El tutor **no agenda**: qué control corresponde es criterio clínico. Puede
 * reagendar una pendiente y decidir si quiere que le avisen, y eso vive en la
 * ficha de cada cita, no acá — esta pantalla es la vista de conjunto.
 *
 * El estado no lo mueve nadie desde la app: lo pone el sistema (Modelo de Datos,
 * 4.7).
 */
const ETIQUETA_DE_TIPO: Record<TipoDeCita, string> = {
  vacuna: 'Vacuna',
  control: 'Control',
  cirugia: 'Cirugía',
};

const ETIQUETA_DE_ESTADO: Record<EstadoDeCita, string> = {
  pendiente: 'Pendiente',
  cumplido: 'Cumplido',
  vencido: 'Vencido',
};

function tono(t: Tokens, estado: EstadoDeCita): { fondo: string; texto: string } {
  const tabla: Record<EstadoDeCita, { fondo: string; texto: string }> = {
    pendiente: { fondo: t['--appt-pending-surface'], texto: t['--appt-pending'] },
    cumplido: { fondo: t['--appt-done-surface'], texto: t['--appt-done'] },
    vencido: { fondo: t['--appt-overdue-surface'], texto: t['--appt-overdue'] },
  };
  return tabla[estado];
}

export function MisCitas() {
  const { t, px, texto } = useTheme();
  const mascotas = useMisMascotas();
  const { citas, cargando, error, reintentar } = useMisCitas(mascotas.data);

  const pendientes = citas.filter((c) => c.cita.estado === ESTADO_DE_CITA.PENDIENTE);
  const pasadas = citas.filter((c) => c.cita.estado !== ESTADO_DE_CITA.PENDIENTE);

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Mis citas</Text>

          {mascotas.isPending || cargando ? (
            <SkeletonText lines={4} />
          ) : error ? (
            <InlineError title="No se pudieron cargar tus citas" onRetry={reintentar} />
          ) : citas.length === 0 ? (
            <EmptyState
              icon="calendar-days"
              title="No tenés citas agendadas"
              description="Las agenda la veterinaria cuando queda un control o una vacuna pendiente, y te avisamos cuando se acerca."
            />
          ) : (
            <>
              {pendientes.length > 0 ? (
                <View style={estilos.grupo}>
                  <Text
                    style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}
                  >
                    PRÓXIMAS
                  </Text>
                  {pendientes.map(({ cita, mascota }) => {
                    const colores = tono(t, cita.estado);
                    return (
                      <View
                        key={cita.id}
                        style={[
                          estilos.tarjeta,
                          sombra('--shadow-sm'),
                          { borderRadius: px('--radius-card'), backgroundColor: colores.fondo },
                        ]}
                      >
                        <Text style={[texto('h4'), { color: colores.texto }]}>
                          {`${ETIQUETA_DE_TIPO[cita.tipo]} · ${mascota.nombre}`}
                        </Text>
                        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                          {`${fechaCorta(diaDeInstante(cita.fecha_programada))} a las ${horaCorta(cita.fecha_programada)}`}
                        </Text>
                        <StatusDot status={cita.estado} label={ETIQUETA_DE_ESTADO[cita.estado]} />
                        <Text style={[texto('caption'), { color: t['--text-muted'] }]}>
                          {cita.notificar_tutor
                            ? 'Te avisamos el día anterior y un rato antes.'
                            : 'No vas a recibir aviso de esta cita.'}
                        </Text>
                        {esReagendable(cita) ? (
                          <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                            Si no podés llegar, pedile a la veterinaria que la mueva.
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {pasadas.length > 0 ? (
                <View style={estilos.grupo}>
                  <Text
                    style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}
                  >
                    ANTERIORES
                  </Text>
                  {pasadas.map(({ cita, mascota }) => {
                    const colores = tono(t, cita.estado);
                    return (
                      <View
                        key={cita.id}
                        style={[
                          estilos.tarjeta,
                          { borderRadius: px('--radius-card'), backgroundColor: colores.fondo },
                        ]}
                      >
                        <Text style={[texto('body-strong'), { color: colores.texto }]}>
                          {`${ETIQUETA_DE_TIPO[cita.tipo]} · ${mascota.nombre}`}
                        </Text>
                        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                          {`${fechaCorta(diaDeInstante(cita.fecha_programada))} · ${ETIQUETA_DE_ESTADO[cita.estado]}`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingVertical: 24, gap: 20 },
  grupo: { gap: 10 },
  tarjeta: { padding: 16, gap: 6 },
});
