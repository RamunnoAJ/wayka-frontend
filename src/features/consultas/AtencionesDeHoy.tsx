import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { sinHistorialCargado, type ConsultaAtendidaConPaciente } from '../../api/consulta';
import {
  Badge,
  Button,
  EmptyState,
  InlineError,
  Presionable,
  Skeleton,
  Tabs,
  type ItemDeTab,
} from '../../components';
import { instanteEnLaClinica } from '../../lib/zona';
import { sombra, useTheme } from '../../theme';
import { sumarDias } from '../citas/calendario';
import { horaCorta, hoyEnLaClinica } from '../paciente/formato';

import { useAtencionesDeLaClinica, useDarDeBajaAtencion } from './queries';

/**
 * Las atenciones asentadas hoy (Alcance de Plataformas, 3.3.1).
 *
 * Abre en **lo que falta documentar**, que es lo único que hace que asentar valga
 * la pena para quien asienta y no solo para quien mira las métricas: la lista es
 * el trabajo pendiente del día, y cada fila lleva a la ficha donde se carga el
 * historial. Con todo cargado queda vacía, y esa es la respuesta correcta.
 *
 * El asiento se corrige dando de baja el que estaba mal y haciendo el que
 * corresponde: mover un hecho asistencial de turno no es editarlo. Editar la hora
 * o el profesional todavía no tiene pantalla — el endpoint existe (PATCH
 * /consultas/{id}) y no se llegó a usar.
 */
type Vista = 'pendientes' | 'todas';

const VISTAS: ItemDeTab<Vista>[] = [
  { value: 'pendientes', label: 'Sin historial' },
  { value: 'todas', label: 'Todas' },
];

interface AtencionesProps {
  onAbrirPaciente: (pacienteId: string) => void;
}

export function AtencionesDeHoy({ onAbrirPaciente }: AtencionesProps) {
  const { t, px, texto } = useTheme();
  const [vista, setVista] = useState<Vista>('pendientes');

  // El día es el de la clínica, no el del reloj del navegador: una atención de
  // las 22:30 en Buenos Aires no es de mañana porque el aparato esté en UTC.
  const filtros = useMemo(() => {
    const hoy = hoyEnLaClinica();
    return {
      desde: instanteEnLaClinica(hoy, 0).toISOString(),
      hasta: instanteEnLaClinica(sumarDias(hoy, 1), 0).toISOString(),
      ...(vista === 'pendientes' ? { sin_historial: true } : {}),
      limite: 200,
    };
  }, [vista]);

  const atenciones = useAtencionesDeLaClinica(filtros);
  const filas = atenciones.data ?? [];

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View
          style={[
            estilos.contenido,
            { maxWidth: px('--content-max'), paddingHorizontal: px('--gutter-page') },
          ]}
        >
          <View style={estilos.titulo}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Atenciones de hoy</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              Lo que se atendió, con o sin historial cargado. Asentar la atención es un paso aparte
              de escribir el historial: se hace al atender, y el evento clínico puede esperar.
            </Text>
          </View>

          <Tabs items={VISTAS} value={vista} onChange={setVista} />

          {atenciones.isPending ? <Skeleton height={72} /> : null}
          {atenciones.isError ? (
            <InlineError
              title="No se pudieron traer las atenciones de hoy."
              onRetry={() => atenciones.refetch()}
            />
          ) : null}

          {!atenciones.isPending && !atenciones.isError && filas.length === 0 ? (
            <EmptyState
              icon="clipboard-check"
              title={
                vista === 'pendientes'
                  ? 'Todo lo de hoy está documentado'
                  : 'Todavía no se asentó ninguna atención'
              }
              description={
                vista === 'pendientes'
                  ? 'No queda ninguna atención de hoy sin su historial cargado.'
                  : 'Las atenciones se asientan desde la agenda, sobre la cita, o desde la ficha de la mascota.'
              }
            />
          ) : null}

          {filas.map((fila) => (
            <FilaDeAtencion key={fila.consulta.id} fila={fila} onAbrirPaciente={onAbrirPaciente} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FilaDeAtencion({
  fila,
  onAbrirPaciente,
}: {
  fila: ConsultaAtendidaConPaciente;
  onAbrirPaciente: (pacienteId: string) => void;
}) {
  const { t, texto } = useTheme();
  const baja = useDarDeBajaAtencion(fila.consulta.paciente_id);
  const pendiente = sinHistorialCargado(fila);

  return (
    <View style={[estilos.fila, sombra('--shadow-sm'), { backgroundColor: t['--surface-card'] }]}>
      <Presionable
        accessibilityRole="button"
        accessibilityLabel={`Abrir la ficha de ${fila.paciente_nombre}`}
        onPress={() => onAbrirPaciente(fila.consulta.paciente_id)}
        style={estilos.datos}
      >
        <Text style={[texto('body-lg'), { color: t['--text-strong'] }]}>
          {fila.paciente_nombre}
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          {horaCorta(fila.consulta.fecha_hora, fila.zona_horaria)}
          {fila.veterinario_nombre ? ` · ${fila.veterinario_nombre}` : ''}
        </Text>
      </Presionable>

      <View style={estilos.acciones}>
        <Badge tone={pendiente ? 'warning' : 'success'}>
          {pendiente ? 'Sin historial' : `${fila.eventos_clinicos_n} en el historial`}
        </Badge>
        {/*
          Solo sobre lo que todavía no tiene historial: dar de baja un asiento con
          eventos colgados no los borra ni devuelve la cita, y ofrecerlo ahí
          sugeriría que sí.
        */}
        {pendiente ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => baja.mutate(fila.consulta.id)}
            loading={baja.isPending}
            accessibilityLabel={`Dar de baja el asiento de ${fila.paciente_nombre}`}
          >
            No fue atendida
          </Button>
        ) : null}
      </View>
      {baja.isError ? <InlineError title="No se pudo dar de baja el asiento." compact /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', gap: 16, paddingVertical: 24 },
  titulo: { gap: 4 },
  fila: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  datos: { gap: 2, flexGrow: 1, flexShrink: 1 },
  acciones: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
