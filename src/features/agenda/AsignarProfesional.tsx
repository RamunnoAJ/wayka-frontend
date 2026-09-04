import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { Cita } from '../../api/cita';
import { Button, Icon, InlineError, Skeleton } from '../../components';
import { useEntrada } from '../../hooks';
import { mensajeDeError } from '../../lib/errores';
import { duracion, sombra, useTheme } from '../../theme';
import { useAusencias } from '../ausencias';
import {
  calcularDisponibilidad,
  MODO_DE_CALENDARIO,
  motivoDeNoDisponible,
  rangoDelPeriodo,
} from '../citas';
import { horaCorta } from '../paciente/formato';
import { usePlantel } from '../veterinario/queries';

import { useAgenda, useAsignarProfesional } from './queries';

/**
 * Reparte una cita de la clínica: le pone profesional, se lo cambia, o se lo
 * saca (Alcance de Plataformas, 3.6).
 *
 * Existe porque el filtro "sin asignar" es, por contrato, *la lista de lo que
 * todavía hay que repartir* — y repartir desde ahí obligaba a entrar a la ficha
 * del paciente y volver por "Reagendar", que además ofrece mover la hora, que no
 * es lo que se está haciendo.
 *
 * No se ofrece a quien ya tiene otra cita a esa hora ni a quien tiene una
 * ausencia cargada. El backend lo rechaza igual; ofrecerlo y después fallar es
 * un error que la interfaz puede evitar.
 */
interface Props {
  cita: Cita;
  nombreDelPaciente: string;
  zonaHoraria: string | undefined;
  onCerrar: () => void;
}

export function AsignarProfesional({ cita, nombreDelPaciente, zonaHoraria, onCerrar }: Props) {
  const { t, px, texto } = useTheme();
  const entrada = useEntrada();

  const plantel = usePlantel();
  const asignar = useAsignarProfesional();

  // El día de la cita, para medir la disponibilidad contra su propio momento y
  // no contra el período que la agenda esté mostrando.
  //
  // Los bordes salen de `rangoDelPeriodo` y no de un `${dia}T00:00:00` armado a
  // mano: la API los quiere en RFC 3339 y rechaza un instante sin offset, así
  // que un rango escrito a mano no devuelve "nadie ocupado", devuelve 400.
  const dia = cita.fecha_programada.slice(0, 10);
  const rango = rangoDelPeriodo(dia, MODO_DE_CALENDARIO.DIA, zonaHoraria);
  const agendaDelDia = useAgenda({ ...rango, estado: 'pendiente', limite: 200 });
  const ausenciasDelDia = useAusencias(rango);

  const disponibilidad = calcularDisponibilidad({
    momento: cita.fecha_programada,
    citas: agendaDelDia.data,
    ausencias: ausenciasDelDia.data,
    exceptoCitaId: cita.id,
  });

  const cargando = plantel.isPending || agendaDelDia.isPending || ausenciasDelDia.isPending;

  // Sin la agenda o las ausencias del día no hay con qué medir quién está
  // ocupado. Dibujar igual la lista mostraría a todo el plantel como libre, que
  // es justo lo que el contrato manda evitar: ofrecer y después fallar.
  const fallo = plantel.isError || agendaDelDia.isError || ausenciasDelDia.isError;

  function reintentar() {
    if (plantel.isError) void plantel.refetch();
    if (agendaDelDia.isError) void agendaDelDia.refetch();
    if (ausenciasDelDia.isError) void ausenciasDelDia.refetch();
  }

  function elegir(veterinarioId: string) {
    asignar.mutate({ citaId: cita.id, veterinarioId }, { onSuccess: onCerrar });
  }

  return (
    <Modal transparent visible animationType="none" onRequestClose={onCerrar}>
      <Animated.View
        entering={FadeIn.duration(duracion.normal.duration)}
        exiting={FadeOut.duration(duracion.fast.duration)}
        style={estilos.telon}
      >
        <Animated.View
          entering={entrada}
          accessibilityViewIsModal
          style={[
            estilos.panel,
            sombra('--shadow-lg'),
            {
              borderRadius: px('--radius-card'),
              backgroundColor: t['--surface-card'],
              borderColor: t['--border-default'],
              padding: px('--gutter-card'),
            },
          ]}
        >
          <View style={estilos.titulo}>
            <Text style={[texto('h4'), { color: t['--text-strong'] }]}>¿Quién la atiende?</Text>
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
              {`${nombreDelPaciente} · ${horaCorta(cita.fecha_programada, zonaHoraria)}`}
            </Text>
          </View>

          {cargando ? (
            <View style={estilos.lista}>
              <Skeleton height={44} />
              <Skeleton height={44} />
            </View>
          ) : fallo ? (
            <InlineError
              title="No se pudo cargar quién está disponible"
              description="Sin eso no se puede repartir la cita sin pisar otro turno."
              onRetry={reintentar}
            />
          ) : (
            <ScrollView style={estilos.scroll}>
              {(plantel.data ?? []).map((veterinario) => {
                const motivo = motivoDeNoDisponible(veterinario.id, disponibilidad);
                const elegido = cita.veterinario_id === veterinario.id;
                return (
                  <Pressable
                    key={veterinario.id}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: Boolean(motivo), selected: elegido }}
                    disabled={Boolean(motivo) || asignar.isPending}
                    onPress={() => elegir(veterinario.id)}
                    style={({ hovered, pressed }) => [
                      estilos.opcion,
                      {
                        backgroundColor: elegido
                          ? t['--surface-selected']
                          : hovered || pressed
                            ? t['--surface-hover']
                            : 'transparent',
                        opacity: motivo ? 0.5 : 1,
                      },
                    ]}
                  >
                    <View style={estilos.flexible}>
                      <Text style={[texto('body'), { color: t['--text-body'] }]}>
                        {veterinario.nombre}
                      </Text>
                      {motivo ? (
                        <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
                          {motivo}
                        </Text>
                      ) : null}
                    </View>
                    {elegido ? (
                      <Icon name="check" size={16} color={t['--color-primary-strong']} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {asignar.isError ? (
            <InlineError
              compact
              title="No se pudo asignar"
              description={mensajeDeError(asignar.error)}
            />
          ) : null}

          <View style={estilos.acciones}>
            {/*
              Sacar la asignación deja la cita de la clínica otra vez, que es un
              estado válido y no un borrado: vuelve a la cola de lo que hay que
              repartir.
            */}
            {cita.veterinario_id ? (
              <Button variant="ghost" disabled={asignar.isPending} onPress={() => elegir('')}>
                Dejarla sin asignar
              </Button>
            ) : null}
            <Button variant="secondary" disabled={asignar.isPending} onPress={onCerrar}>
              Cancelar
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  telon: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  panel: { borderWidth: 1, gap: 12, width: '100%', maxWidth: 420 },
  titulo: { gap: 2 },
  scroll: { maxHeight: 320 },
  lista: { gap: 8 },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  flexible: { flex: 1, gap: 2 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 },
});
