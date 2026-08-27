import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ESTADO_DE_CITA,
  type CitaConPaciente,
  type EstadoDeCita,
  type TipoDeCita,
} from '../../api/cita';
import {
  Avatar,
  EmptyState,
  InlineError,
  Select,
  SkeletonText,
  type OpcionDeSelect,
} from '../../components';
import { sombra, useTheme, type Tokens } from '../../theme';
import { aIso, diaDeInstante, fechaConDiaDeSemana, horaCorta } from '../paciente/formato';

import { useAgenda } from './queries';

/**
 * Agenda de la clínica (Alcance de Plataformas, 3.6).
 *
 * Se agrupa por día y no se dibuja como grilla horaria: sin agenda por
 * profesional, dos citas de la misma hora no colisionan y una grilla sugeriría
 * que sí (Modelo de Datos, 4.7). Cuando la Cita lleve veterinario asignado, ese
 * es el momento de cambiarla.
 */
const ETIQUETA_DE_TIPO: Record<TipoDeCita, string> = {
  vacuna: 'Vacuna',
  control: 'Control',
  cirugia: 'Cirugía',
};

const VENTANAS: OpcionDeSelect[] = [
  { value: '7', label: 'Próximos 7 días' },
  { value: '30', label: 'Próximos 30 días' },
  { value: '90', label: 'Próximos 3 meses' },
];

const ESTADOS: OpcionDeSelect[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'vencido', label: 'Vencidas' },
  { value: 'cumplido', label: 'Cumplidas' },
  { value: 'todas', label: 'Todas' },
];

function tono(t: Tokens, estado: EstadoDeCita): { fondo: string; texto: string } {
  const tabla: Record<EstadoDeCita, { fondo: string; texto: string }> = {
    pendiente: { fondo: t['--appt-pending-surface'], texto: t['--appt-pending'] },
    cumplido: { fondo: t['--appt-done-surface'], texto: t['--appt-done'] },
    vencido: { fondo: t['--appt-overdue-surface'], texto: t['--appt-overdue'] },
  };
  return tabla[estado];
}

interface AgendaProps {
  onAbrirPaciente: (pacienteId: string) => void;
}

export function AgendaDeLaClinica({ onAbrirPaciente }: AgendaProps) {
  const { t, px, texto } = useTheme();
  const [dias, setDias] = useState('7');
  const [estado, setEstado] = useState('pendiente');

  const filtros = useMemo(() => {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + Number(dias));
    return {
      // Las vencidas quedarían fuera de una ventana que arranca hoy: es
      // justamente lo que ya pasó y sigue pendiente de resolver.
      ...(estado === 'vencido' ? {} : { desde: inicio.toISOString() }),
      hasta: fin.toISOString(),
      ...(estado === 'todas' ? {} : { estado: estado as EstadoDeCita }),
      limite: 200,
    };
  }, [dias, estado]);

  const agenda = useAgenda(filtros);

  const porDia = useMemo(() => {
    const mapa = new Map<string, CitaConPaciente[]>();
    for (const fila of agenda.data ?? []) {
      const clave = diaDeInstante(fila.cita.fecha_programada);
      const dia = mapa.get(clave);
      if (dia) dia.push(fila);
      else mapa.set(clave, [fila]);
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [agenda.data]);

  const hoy = aIso(new Date());

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View
          style={[
            estilos.contenido,
            { maxWidth: px('--content-max'), paddingHorizontal: px('--gutter-page') },
          ]}
        >
          <View style={estilos.encabezado}>
            <View style={estilos.titulo}>
              <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Agenda</Text>
              <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
                Las citas de toda la clínica. Es una agenda de la clínica, no de cada profesional:
                dos turnos de la misma hora no se pisan.
              </Text>
            </View>
          </View>

          <View style={estilos.filtros}>
            <View style={estilos.campo}>
              <Select label="Estado" options={ESTADOS} value={estado} onChange={setEstado} />
            </View>
            <View style={estilos.campo}>
              <Select label="Ventana" options={VENTANAS} value={dias} onChange={setDias} />
            </View>
          </View>

          {agenda.isPending ? (
            <SkeletonText lines={5} />
          ) : agenda.isError ? (
            <InlineError title="No se pudo cargar la agenda" onRetry={() => agenda.refetch()} />
          ) : porDia.length === 0 ? (
            <EmptyState
              icon="calendar-days"
              title="No hay citas en esta ventana"
              description="Probá con un rango más largo, o con otro estado."
            />
          ) : (
            porDia.map(([dia, filas]) => (
              <View key={dia} style={estilos.dia}>
                <View style={estilos.diaTitulo}>
                  <Text style={[texto('h3'), { color: t['--text-strong'] }]}>
                    {fechaConDiaDeSemana(dia)}
                  </Text>
                  {dia === hoy ? (
                    <Text
                      style={[
                        texto('caption'),
                        { fontWeight: '700', color: t['--color-primary-strong'] },
                      ]}
                    >
                      HOY
                    </Text>
                  ) : null}
                  <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
                    {`${filas.length} cita${filas.length === 1 ? '' : 's'}`}
                  </Text>
                </View>

                {filas.map(({ cita, paciente_nombre, paciente_especie }) => {
                  const colores = tono(t, cita.estado);
                  return (
                    <Pressable
                      key={cita.id}
                      accessibilityRole="button"
                      onPress={() => onAbrirPaciente(cita.paciente_id)}
                      style={({ hovered, pressed }) => [
                        estilos.fila,
                        sombra('--shadow-sm'),
                        {
                          borderRadius: px('--radius-card'),
                          borderColor: t['--border-default'],
                          backgroundColor:
                            hovered || pressed ? t['--surface-hover'] : t['--surface-card'],
                        },
                      ]}
                    >
                      <View
                        style={[
                          estilos.hora,
                          { backgroundColor: colores.fondo, borderRadius: px('--radius-md') },
                        ]}
                      >
                        <Text style={[texto('body-strong'), { color: colores.texto }]}>
                          {horaCorta(cita.fecha_programada)}
                        </Text>
                      </View>
                      <Avatar name={paciente_nombre} species={paciente_especie} size="sm" />
                      <View style={estilos.flexible}>
                        <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                          {paciente_nombre}
                        </Text>
                        <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
                          {ETIQUETA_DE_TIPO[cita.tipo]}
                        </Text>
                      </View>
                      {cita.estado !== ESTADO_DE_CITA.PENDIENTE ? (
                        <Text
                          style={[texto('caption'), { fontWeight: '600', color: colores.texto }]}
                        >
                          {cita.estado.toUpperCase()}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 20 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  titulo: { flex: 1, minWidth: 260, gap: 6 },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 1, flexBasis: 200, minWidth: 180, maxWidth: 260 },
  dia: { gap: 10 },
  diaTitulo: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 12 },
  hora: { paddingVertical: 8, paddingHorizontal: 12, minWidth: 68, alignItems: 'center' },
  flexible: { flex: 1, minWidth: 140, gap: 2 },
});
