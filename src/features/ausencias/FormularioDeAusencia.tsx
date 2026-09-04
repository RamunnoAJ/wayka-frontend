import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { CrearAusenciaEntrada } from '../../api/ausencia';
import {
  Button,
  InlineError,
  Input,
  Select,
  SkeletonText,
  type OpcionDeSelect,
} from '../../components';
import { useEntrada } from '../../hooks';
import { mensajeDeError } from '../../lib/errores';
import { hoyEnLaClinica, instanteEnLaClinica } from '../../lib/zona';
import { duracion, sombra, useTheme } from '../../theme';

import { minutosDeHora } from '../clinica/grilla';
import { momentoCorto } from '../paciente/formato';
import { useCrearAusencia, usePrevisualizacionDeAusencia } from './queries';

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

/**
 * El rango, una vez que dejó de moverse. Las fechas se escriben a mano, así que
 * sin esta espera cada tecla dispararía una consulta —y las intermedias son
 * rangos que el usuario no quiso preguntar.
 *
 * Devuelve null mientras el rango no cierre o mientras se lo está escribiendo:
 * ahí no hay nada que calcular. Que el descarte sea derivado y no un `setState`
 * dentro del efecto es lo que garantiza que el efecto ya calculado no se vea un
 * instante de más, atribuido al rango nuevo.
 */
function useRangoDemorado(
  entrada: CrearAusenciaEntrada,
  habilitado: boolean,
  ms = 400,
): CrearAusenciaEntrada | null {
  const { veterinario_id, desde, hasta } = entrada;
  const [estable, setEstable] = useState<CrearAusenciaEntrada | null>(null);

  useEffect(() => {
    if (!habilitado) return;
    const id = setTimeout(() => setEstable({ veterinario_id, desde, hasta }), ms);
    return () => clearTimeout(id);
  }, [veterinario_id, desde, hasta, habilitado, ms]);

  const alDia =
    estable !== null &&
    estable.veterinario_id === veterinario_id &&
    estable.desde === desde &&
    estable.hasta === hasta;

  return habilitado && alDia ? estable : null;
}

export function FormularioDeAusencia({ veterinarioId, nombre, zonaHoraria, onCerrar }: Props) {
  const { t, px, texto } = useTheme();
  const entrada = useEntrada();
  const crear = useCrearAusencia();

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

  // El efecto se calcula solo. El contrato no dice que se pueda ver: dice que
  // la pantalla lo dice **antes de guardar** (Alcance 3.2.3, Reglas 4.22), y
  // desasignar turnos no se deshace —dar de baja la ausencia no los devuelve—,
  // así que enterarse después no sirve de nada.
  const previsualizar = usePrevisualizacionDeAusencia(useRangoDemorado(alta, !rangoInvalido));

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
                onChangeText={setDesdeDia}
              />
            </View>
            <View style={estilos.campoChico}>
              <Select label="Hora" options={HORAS} value={desdeHora} onChange={setDesdeHora} />
            </View>
          </View>

          <View style={estilos.fila}>
            <View style={estilos.campo}>
              <Input
                label="Hasta"
                value={hastaDia}
                placeholder="AAAA-MM-DD"
                onChangeText={setHastaDia}
              />
            </View>
            <View style={estilos.campoChico}>
              <Select label="Hora" options={HORAS} value={hastaHora} onChange={setHastaHora} />
            </View>
          </View>

          {rangoInvalido ? (
            <InlineError
              compact
              title="El rango no cierra"
              description="El fin de la ausencia tiene que ser posterior a su comienzo."
            />
          ) : null}

          {rangoInvalido ? null : (
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
              {previsualizar.isError ? (
                <InlineError
                  compact
                  title="No se pudo calcular el efecto"
                  description="Sin esto no se sabe qué turnos quedarían sin profesional."
                  onRetry={() => void previsualizar.refetch()}
                />
              ) : previsualizar.data === undefined ? (
                <SkeletonText lines={2} />
              ) : previsualizar.data.citas_afectadas === 0 ? (
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  No hay ninguna cita asignada adentro de ese rango.
                </Text>
              ) : (
                <>
                  <Text style={[texto('body'), { color: t['--text-strong'] }]}>
                    {previsualizar.data.citas_afectadas === 1
                      ? '1 cita va a quedar sin profesional.'
                      : `${previsualizar.data.citas_afectadas} citas van a quedar sin profesional.`}
                  </Text>
                  {/*
                    Cuáles son, y no solo cuántas: corregir el rango a ciegas
                    hasta que el número baje no es cargar una ausencia.
                  */}
                  <ScrollView style={estilos.horarios}>
                    {/* Dos citas pueden caer en el mismo instante: el índice desempata. */}
                    {previsualizar.data.horarios.map((horario, i) => (
                      <Text
                        key={`${horario}-${i}`}
                        style={[texto('body-sm'), { color: t['--text-body'] }]}
                      >
                        {momentoCorto(horario, zonaHoraria)}
                      </Text>
                    ))}
                  </ScrollView>
                  <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                    No se cancelan ni se mueven de hora: pasan a la cola de sin asignar, para que
                    alguien las reparta.
                  </Text>
                </>
              )}
            </View>
          )}

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
              Guardar no espera a la previsualización: la ausencia se guarda
              igual, porque impedir registrar que alguien no vino no hace que
              haya venido. El efecto ya se dijo, que es lo que el contrato pide.
            */}
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
  // Todas las citas afectadas entran, sin que el diálogo crezca sin límite.
  horarios: { maxHeight: 132 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 },
});
