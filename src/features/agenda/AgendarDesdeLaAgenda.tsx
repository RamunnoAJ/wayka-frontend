import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { PacienteEnLaCartera } from '../../api/paciente';
import { Button, InlineError, Input, Skeleton } from '../../components';
import { useEntrada } from '../../hooks';
import { mensajeDeError } from '../../lib/errores';
import { duracion, sombra, useTheme } from '../../theme';
import { useGrilla, useMiClinica } from '../clinica';
import { FormularioDeCita } from '../paciente/FormularioDeCita';
import { usePlantel } from '../veterinario/queries';

import { AltaDesdeElMostrador } from './AltaDesdeElMostrador';
import { useAgendarDesdeLaAgenda, useCartera } from './queries';

/**
 * Agenda un turno desde la agenda de la clínica (Alcance de Plataformas, 3.2.2).
 *
 * Son dos pasos y no uno: primero **para quién**, después **cuándo**. El
 * clínica_admin no lee Paciente, así que la mascota se elige de la cartera —una
 * proyección con nombre, especie y a quién llamar— y no de una lista de fichas.
 *
 * Elegir primero la mascota y no la hora no es un capricho de orden: la grilla
 * depende de la clínica que la atiende, y sin mascota no hay contra qué
 * validar.
 *
 * Si la mascota todavía no está, se la da de alta acá mismo
 * (`AltaDesdeElMostrador`) y el turno sigue en el mismo flujo: el cliente nuevo
 * que llama es justamente el que más necesita el turno.
 */
interface Props {
  onCerrar: () => void;
}

export function AgendarDesdeLaAgenda({ onCerrar }: Props) {
  const { t, px, texto } = useTheme();
  const entrada = useEntrada();

  const [busqueda, setBusqueda] = useState('');
  const [elegida, setElegida] = useState<PacienteEnLaCartera | null>(null);
  const [dandoDeAlta, setDandoDeAlta] = useState(false);

  const cartera = useCartera(busqueda);
  const clinica = useMiClinica();
  const grilla = useGrilla(clinica.data?.id);
  const plantel = usePlantel();
  const agendar = useAgendarDesdeLaAgenda();

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
          {dandoDeAlta ? (
            <AltaDesdeElMostrador
              nombreDeLaMascota={busqueda.trim()}
              onDadaDeAlta={(paciente) => {
                setDandoDeAlta(false);
                setElegida(paciente);
              }}
              onCancelar={() => setDandoDeAlta(false)}
            />
          ) : !elegida ? (
            <>
              <View style={estilos.titulo}>
                <Text style={[texto('h4'), { color: t['--text-strong'] }]}>¿Para quién?</Text>
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  Buscá entre las mascotas que atiende la clínica.
                </Text>
              </View>

              <Input
                label="Nombre de la mascota"
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Luna"
              />

              {busqueda.trim().length === 0 ? (
                <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
                  Escribí un nombre para buscar.
                </Text>
              ) : cartera.isPending ? (
                <Skeleton height={44} />
              ) : cartera.isError ? (
                <InlineError
                  title="No se pudo buscar"
                  description={mensajeDeError(cartera.error)}
                  onRetry={() => cartera.refetch()}
                />
              ) : cartera.data.length === 0 ? (
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  Ninguna mascota de la clínica se llama así.
                </Text>
              ) : (
                <ScrollView style={estilos.scroll}>
                  {cartera.data.map((paciente) => (
                    <Pressable
                      key={paciente.id}
                      accessibilityRole="button"
                      onPress={() => setElegida(paciente)}
                      style={({ hovered, pressed }) => [
                        estilos.opcion,
                        {
                          backgroundColor:
                            hovered || pressed ? t['--surface-hover'] : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[texto('body'), { color: t['--text-strong'] }]}>
                        {`${paciente.nombre} · ${paciente.especie}`}
                      </Text>
                      {/* A quién llamar: es la mitad de para qué sirve esta lista
                          en el mostrador. */}
                      <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                        {`${paciente.tutor_nombre} · ${paciente.tutor_contacto}`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <View style={estilos.acciones}>
                <Button variant="ghost" onPress={onCerrar}>
                  Cancelar
                </Button>
                {/*
                  Siempre visible, y no solo cuando la búsqueda no encuentra
                  nada: la mascota puede estar en el sistema con otro nombre, o
                  el que aparece puede no ser el que llama.
                */}
                <Button variant="secondary" iconLeft="plus" onPress={() => setDandoDeAlta(true)}>
                  Es nueva: darla de alta
                </Button>
              </View>
            </>
          ) : (
            <>
              <View style={estilos.titulo}>
                <Text style={[texto('h4'), { color: t['--text-strong'] }]}>
                  {`Turno para ${elegida.nombre}`}
                </Text>
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  {`${elegida.tutor_nombre} · ${elegida.tutor_contacto}`}
                </Text>
              </View>

              <ScrollView style={estilos.scrollAlto}>
                <FormularioDeCita
                  grilla={grilla.data}
                  plantel={plantel.data}
                  enviando={agendar.isPending}
                  error={agendar.error ? mensajeDeError(agendar.error) : undefined}
                  etiquetaGuardar="Agendar"
                  onGuardar={(entradaDeCita) =>
                    agendar.mutate(
                      { pacienteId: elegida.id, entrada: entradaDeCita },
                      { onSuccess: onCerrar },
                    )
                  }
                  onCancelar={() => setElegida(null)}
                />
              </ScrollView>
            </>
          )}
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
  panel: { borderWidth: 1, gap: 12, width: '100%', maxWidth: 520 },
  titulo: { gap: 2 },
  scroll: { maxHeight: 260 },
  scrollAlto: { maxHeight: 460 },
  opcion: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, gap: 2 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
});
