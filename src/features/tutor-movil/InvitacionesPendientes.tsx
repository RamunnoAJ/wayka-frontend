import { StyleSheet, Text, View } from 'react-native';

import { Button, Icon } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';
import {
  useAceptarInvitacionRecibida,
  useInvitacionesRecibidas,
  useRechazarInvitacion,
} from '../accesos/queries';

/**
 * Las mascotas que alguien te compartió y todavía no aceptaste.
 *
 * Va arriba de Mis mascotas y no en una pantalla propia: es donde el tutor mira,
 * y una invitación que vive detrás de un menú es una que nadie encuentra. Hasta
 * ahora el único aviso era el correo, así que quien no lo revisaba no se
 * enteraba nunca.
 *
 * Dice qué mascota es, quién la compartió y qué va a poder hacer. Nada del
 * historial: aceptar es lo que da acceso a él.
 */
export function InvitacionesPendientes() {
  const { t, px, texto } = useTheme();
  const invitaciones = useInvitacionesRecibidas();
  const aceptar = useAceptarInvitacionRecibida();
  const rechazar = useRechazarInvitacion();

  // Sin conexión no se ven, y no es un error que valga la pena mostrar: la
  // pantalla tiene su propio indicador de sincronización y esto es accesorio.
  if (invitaciones.isPending || invitaciones.isError) return null;
  if ((invitaciones.data?.length ?? 0) === 0) return null;

  const error = aceptar.error ?? rechazar.error;

  return (
    <View style={estilos.lista}>
      {invitaciones.data?.map((invitacion) => (
        <View
          key={invitacion.id}
          style={[
            estilos.tarjeta,
            {
              borderRadius: px('--radius-card'),
              backgroundColor: t['--surface-accent-soft'],
              borderColor: t['--color-primary-strong'],
            },
          ]}
        >
          <View style={estilos.encabezado}>
            <Icon name="paw-print" size={18} color={t['--color-primary-strong']} />
            <Text style={[texto('body-strong'), { color: t['--text-strong'], flex: 1 }]}>
              {`${invitacion.invitado_por} te compartió a ${invitacion.nombre_del_paciente}`}
            </Text>
          </View>

          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            {invitacion.nivel === 'edicion'
              ? 'Vas a poder ver su historial y editar sus datos.'
              : 'Vas a poder ver su historial.'}
          </Text>

          {error ? (
            <Text style={[texto('body-sm'), { color: t['--text-danger'] }]}>
              {mensajeDeError(error)}
            </Text>
          ) : null}

          <View style={estilos.acciones}>
            <Button
              size="sm"
              loading={aceptar.isPending}
              onPress={() => aceptar.mutate(invitacion.id)}
            >
              Aceptar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={rechazar.isPending}
              onPress={() => rechazar.mutate(invitacion.id)}
            >
              Rechazar
            </Button>
          </View>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: 10 },
  tarjeta: { borderWidth: 1, padding: 14, gap: 8 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  acciones: { flexDirection: 'row', gap: 8 },
});
