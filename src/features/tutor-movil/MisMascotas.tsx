import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Paciente } from '../../api/paciente';
import {
  Avatar,
  Badge,
  EmptyState,
  InlineError,
  Presionable,
  SkeletonText,
} from '../../components';
import { sombra, useTheme } from '../../theme';
import { IndicadorDeSincronizacion } from '../sincronizacion';
import { capitalizar, edad, peso } from '../paciente/formato';

import { useMisMascotas } from './queries';

/**
 * Mis mascotas (Alcance de Plataformas, 5.2).
 *
 * Nace vacío y eso no es un error: el tutor no da de alta mascotas por su
 * cuenta — el alta la inicia el veterinario, porque fija la clínica del paciente
 * (proceso 4.1). El vacío tiene que explicar eso, no ofrecer un botón que no
 * existe.
 */
export function MisMascotas({
  onAbrir,
  onVerRechazos,
}: {
  onAbrir: (mascota: Paciente) => void;
  onVerRechazos: () => void;
}) {
  const { t, px, texto } = useTheme();
  const mascotas = useMisMascotas();

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Mis mascotas</Text>

          <IndicadorDeSincronizacion onVerRechazos={onVerRechazos} />

          {mascotas.isPending ? (
            <SkeletonText lines={4} />
          ) : mascotas.isError ? (
            <InlineError
              title="No se pudieron cargar tus mascotas"
              onRetry={() => mascotas.refetch()}
            />
          ) : (mascotas.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon="paw-print"
              title="Todavía no hay ninguna"
              description="Cuando lleves a tu mascota a una veterinaria que use Wayka, la clínica la va a vincular a tu cuenta y su historial aparece acá."
            />
          ) : (
            <View style={estilos.lista}>
              {mascotas.data?.map((mascota) => (
                <Presionable
                  key={mascota.id}
                  onPress={() => onAbrir(mascota)}
                  fondo={t['--surface-card']}
                  fondoDestacado={t['--surface-hover']}
                  borde={t['--border-default']}
                  style={[
                    estilos.tarjeta,
                    sombra('--shadow-sm'),
                    { borderRadius: px('--radius-card') },
                  ]}
                >
                  <Avatar name={mascota.nombre} species={mascota.especie} size="lg" />
                  <View style={estilos.flexible}>
                    <Text style={[texto('h4'), { color: t['--text-strong'] }]}>
                      {mascota.nombre}
                    </Text>
                    <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
                      {[capitalizar(mascota.raza), edad(mascota.fecha_nacimiento)].join(' · ')}
                    </Text>
                  </View>
                  <Badge tone="neutral">{peso(mascota.peso_actual)}</Badge>
                </Presionable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingVertical: 24, gap: 20 },
  lista: { gap: 12 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 14 },
  flexible: { flex: 1, minWidth: 120, gap: 2 },
});
