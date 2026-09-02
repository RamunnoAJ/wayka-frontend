import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { CrearAusenciaEntrada } from '../../api/ausencia';
import { Button, InlineError, Input, Select, type OpcionDeSelect } from '../../components';
import { useEntrada } from '../../hooks';
import { mensajeDeError } from '../../lib/errores';
import { hoyEnLaClinica, instanteEnLaClinica } from '../../lib/zona';
import { duracion, sombra, useTheme } from '../../theme';

import { minutosDeHora } from '../clinica/grilla';
import { useCrearAusencia, usePrevisualizarAusencia } from './queries';

/**
 * Carga una ausencia de una persona del plantel (Alcance de Plataformas, 3.2.3).
 *
 * Se abre desde la fila de esa persona y no desde una sección aparte: **una
 * ausencia es de alguien**, y el lugar donde se la busca es su fila. Por eso
 * tampoco pide elegir profesional — ya se eligió al abrirlo.
 *
 * No se pide un motivo y no hay dónde escribirlo: el de la ausencia de un
 * empleado puede ser un dato de salud, y para que la agenda funcione alcanza con
 * el rango.
 */
const HORAS: OpcionDeSelect[] = Array.from({ length: 24 }, (_, i) => {
  const hora = `${String(i).padStart(2, '0')}:00`;
  return { value: hora, label: hora };
});

interface Props {
  veterinarioId: string;
  nombre: string;
  zonaHoraria: string | undefined;
  onCerrar: () => void;
}

export function FormularioDeAusencia({ veterinarioId, nombre, zonaHoraria, onCerrar }: Props) {
  const { t, px, texto } = useTheme();
  const entrada = useEntrada();
  const crear = useCrearAusencia();
  const previsualizar = usePrevisualizarAusencia();

  const hoy = hoyEnLaClinica(zonaHoraria);
  const [desdeDia, setDesdeDia] = useState(hoy);
  const [desdeHora, setDesdeHora] = useState('09:00');
  const [hastaDia, setHastaDia] = useState(hoy);
  const [hastaHora, setHastaHora] = useState('20:00');

  const alta: CrearAusenciaEntrada = {
    veterinario_id: veterinarioId,
    desde: instanteEnLaClinica(desdeDia, minutosDeHora(desdeHora), zonaHoraria).toISOString(),
    hasta: instanteEnLaClinica(hastaDia, minutosDeHora(hastaHora), zonaHoraria).toISOString(),
  };
  const rangoInvalido = !(alta.hasta > alta.desde);

  function cambiar(aplicar: () => void) {
    aplicar();
    // La previsualización que se ve corresponde al rango anterior: dejarla diría
    // que el efecto ya calculado sigue valiendo.
    previsualizar.reset();
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
            <Text style={[texto('h4'), { color: t['--text-strong'] }]}>
              {`¿Cuándo no va a estar ${nombre}?`}
            </Text>
            <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
              Para que la agenda no le ofrezca turnos. No hace falta el motivo.
            </Text>
          </View>

          <View style={estilos.fila}>
            <View style={estilos.campo}>
              <Input
                label="Desde"
                value={desdeDia}
                placeholder="AAAA-MM-DD"
                onChangeText={(valor) => cambiar(() => setDesdeDia(valor))}
              />
            </View>
            <View style={estilos.campoChico}>
              <Select
                label="Hora"
                options={HORAS}
                value={desdeHora}
                onChange={(valor) => cambiar(() => setDesdeHora(valor))}
              />
            </View>
          </View>

          <View style={estilos.fila}>
            <View style={estilos.campo}>
              <Input
                label="Hasta"
                value={hastaDia}
                placeholder="AAAA-MM-DD"
                onChangeText={(valor) => cambiar(() => setHastaDia(valor))}
              />
            </View>
            <View style={estilos.campoChico}>
              <Select
                label="Hora"
                options={HORAS}
                value={hastaHora}
                onChange={(valor) => cambiar(() => setHastaHora(valor))}
              />
            </View>
          </View>

          {rangoInvalido ? (
            <InlineError
              compact
              title="El rango no cierra"
              description="El fin de la ausencia tiene que ser posterior a su comienzo."
            />
          ) : null}

          {previsualizar.data ? (
            <View
              style={[
                estilos.efecto,
                {
                  backgroundColor: t['--surface-hover'],
                  padding: px('--gutter-card'),
                  borderRadius: px('--radius-card'),
                },
              ]}
            >
              {previsualizar.data.citas_afectadas === 0 ? (
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  No hay ninguna cita asignada adentro de ese rango.
                </Text>
              ) : (
                <>
                  <Text style={[texto('body'), { color: t['--text-strong'] }]}>
                    {`${previsualizar.data.citas_afectadas} cita(s) van a quedar sin profesional.`}
                  </Text>
                  <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                    No se cancelan ni se mueven de hora: pasan a la cola de sin asignar, para que
                    alguien las reparta.
                  </Text>
                </>
              )}
            </View>
          ) : null}

          {crear.isError ? (
            <InlineError
              compact
              title="No se pudo cargar la ausencia"
              description={mensajeDeError(crear.error)}
            />
          ) : null}

          <View style={estilos.acciones}>
            <Button variant="ghost" disabled={crear.isPending} onPress={onCerrar}>
              Cancelar
            </Button>
            {/*
              El efecto se puede ver antes de guardar, y guardar no lo exige: la
              ausencia se guarda igual, porque impedir registrar que alguien no
              vino no hace que haya venido.
            */}
            <Button
              variant="secondary"
              disabled={rangoInvalido}
              loading={previsualizar.isPending}
              onPress={() => previsualizar.mutate(alta)}
            >
              Ver qué citas afecta
            </Button>
            <Button
              disabled={rangoInvalido}
              loading={crear.isPending}
              onPress={() => crear.mutate(alta, { onSuccess: onCerrar })}
            >
              Cargar la ausencia
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
  panel: { borderWidth: 1, gap: 12, width: '100%', maxWidth: 460 },
  titulo: { gap: 2 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' },
  campo: { flex: 1, minWidth: 150 },
  campoChico: { width: 110 },
  efecto: { gap: 4 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 },
});
