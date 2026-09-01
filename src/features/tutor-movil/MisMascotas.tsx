import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Paciente } from '../../api/paciente';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  InlineError,
  Presionable,
  SkeletonText,
} from '../../components';
import { EtiquetaDeNivel } from '../accesos/EtiquetaDeNivel';
import { sombra, useTheme } from '../../theme';
import { IndicadorDeSincronizacion } from '../sincronizacion';
import { capitalizar, edad, peso } from '../paciente/formato';

import { useMisMascotas } from './queries';

/**
 * Mis mascotas (Alcance de Plataformas, 5.2).
 *
 * Lista las que el tutor alcanza: las suyas y las que otra persona le compartió,
 * con una etiqueta que distingue unas de otras. El vacío ofrece cargar la
 * primera — el alta ya no depende de que una clínica lo haga.
 */
export function MisMascotas({
  onAbrir,
  onVerRechazos,
  onAgregar,
}: {
  onAbrir: (mascota: Paciente) => void;
  onVerRechazos: () => void;
  onAgregar: () => void;
}) {
  const { t, px, texto } = useTheme();
  const mascotas = useMisMascotas();

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <View style={estilos.encabezado}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Mis mascotas</Text>
            <Button variant="secondary" size="sm" iconLeft="plus" onPress={onAgregar}>
              Agregar
            </Button>
          </View>

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
              description="Cargá a tu mascota para tener su ficha y su historial en un solo lugar. Después vas a poder compartirla con tu veterinaria y con quien la cuide."
              action={
                <Button variant="primary" iconLeft="plus" onPress={onAgregar}>
                  Agregar una mascota
                </Button>
              }
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
                  <View style={estilos.marcas}>
                    <Badge tone="neutral">{peso(mascota.peso_actual)}</Badge>
                    {/* Solo en las ajenas: en las propias, decir "dueño" en cada
                        tarjeta sería ruido — es el caso normal. */}
                    {mascota.nivel_de_acceso && mascota.nivel_de_acceso !== 'dueno' ? (
                      <EtiquetaDeNivel nivel={mascota.nivel_de_acceso} />
                    ) : null}
                  </View>
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
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lista: { gap: 12 },
  marcas: { alignItems: 'flex-end', gap: 6 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 14 },
  flexible: { flex: 1, minWidth: 120, gap: 2 },
});
