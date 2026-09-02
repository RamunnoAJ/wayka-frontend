import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ConteoPorProfesional, PeriodoDelTablero } from '../../api/tablero';
import { Button, InlineError, Skeleton } from '../../components';
import { sombra, useTheme } from '../../theme';

import { useTablero } from './queries';

/**
 * Tablero del clinica_admin (Alcance de Plataformas, 3.2.1).
 *
 * Cuatro bloques de conteos. Ninguno lista registros ni nombra una mascota: el
 * rol no alcanza el historial clínico, y un listado de atenciones con hora y
 * profesional lo reconstruiría por el costado.
 *
 * El toggle de período es **uno solo y arriba de todo**, no uno por bloque:
 * comparar la ocupación de la semana contra las atenciones del mes es leer dos
 * cosas que no se corresponden, y dos controles invitan justo a eso.
 */
const ETIQUETA_DE_ORIGEN: Record<string, string> = {
  agendada: 'Agendadas',
  espontanea: 'Espontáneas',
  urgencia: 'Urgencias',
  alta_de_la_clinica: 'Alta de la clínica',
  compartido_por_el_tutor: 'Compartidas por el tutor',
  migracion: 'Migración',
};

interface Props {
  clinicaId: string;
}

export function Tablero({ clinicaId }: Props) {
  const { t, px, texto } = useTheme();
  const [periodo, setPeriodo] = useState<PeriodoDelTablero>('semana');
  const consulta = useTablero(clinicaId, periodo);

  const tarjeta = {
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
    padding: px('--gutter-card'),
  };

  return (
    <View style={estilos.raiz}>
      <View style={estilos.encabezado}>
        <Text style={[texto('h3'), { color: t['--text-strong'] }]}>Cómo viene la clínica</Text>
        <View style={estilos.toggle}>
          {(['semana', 'mes'] as PeriodoDelTablero[]).map((opcion) => (
            <Button
              key={opcion}
              size="sm"
              variant={periodo === opcion ? 'primary' : 'secondary'}
              onPress={() => setPeriodo(opcion)}
            >
              {opcion === 'semana' ? 'Esta semana' : 'Este mes'}
            </Button>
          ))}
        </View>
      </View>

      {consulta.isPending ? (
        <View style={estilos.grilla}>
          <Skeleton height={140} />
          <Skeleton height={140} />
        </View>
      ) : consulta.isError ? (
        <InlineError title="No se pudo cargar el tablero" onRetry={() => consulta.refetch()} />
      ) : (
        <>
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            {rangoLegible(consulta.data.desde, consulta.data.hasta)}
          </Text>

          <View style={estilos.grilla}>
            <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
              <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
                OCUPACIÓN DE LA AGENDA
              </Text>
              <Text style={[texto('h2'), { color: t['--text-strong'] }]}>
                {`${consulta.data.ocupacion.turnos_ocupados} / ${consulta.data.ocupacion.turnos_disponibles}`}
              </Text>
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                {`turnos tomados sobre los que produce el horario de atención`}
              </Text>
              {/*
                Sin asignar va acá y no como bloque propio: es una parte de esos
                turnos ocupados, no otra cosa que contar.
              */}
              <Text style={[texto('body'), { color: t['--text-strong'] }]}>
                {consulta.data.ocupacion.sin_asignar === 0
                  ? 'Todo repartido: no queda ninguna cita sin profesional.'
                  : `${consulta.data.ocupacion.sin_asignar} sin profesional, para repartir.`}
              </Text>
              <PorProfesional filas={consulta.data.ocupacion.por_profesional} />
            </View>

            <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
              <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
                ATENCIONES
              </Text>
              <Text style={[texto('h2'), { color: t['--text-strong'] }]}>
                {consulta.data.atenciones.total}
              </Text>
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                Lo atendido de verdad, que no coincide con la agenda: la mayoría de las atenciones
                de una veterinaria no estaban agendadas.
              </Text>
              <PorOrigen conteos={consulta.data.atenciones.por_origen} />
              <PorProfesional filas={consulta.data.atenciones.por_profesional} />
            </View>

            <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
              <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
                CARTERA
              </Text>
              <Text style={[texto('h2'), { color: t['--text-strong'] }]}>
                {consulta.data.cartera.pacientes_vigentes}
              </Text>
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                {`mascotas que atiende hoy · ${consulta.data.cartera.altas_del_periodo} entraron en el período`}
              </Text>
              <PorOrigen conteos={consulta.data.cartera.altas_por_origen} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

/**
 * El corte por profesional trae a todo el plantel, incluido el que no tiene nada
 * en el período: un cero es la respuesta a "qué hizo esta persona esta semana", y
 * esconder la fila la haría invisible justo cuando importa.
 */
function PorProfesional({ filas }: { filas: ConteoPorProfesional[] }) {
  const { t, texto } = useTheme();
  if (filas.length === 0) return null;

  return (
    <View style={estilos.lista}>
      {filas.map((fila) => (
        <View key={fila.veterinario_id} style={estilos.filaDeLista}>
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{fila.nombre}</Text>
          <Text style={[texto('body-sm'), { color: t['--text-strong'] }]}>{fila.cantidad}</Text>
        </View>
      ))}
    </View>
  );
}

function PorOrigen({ conteos }: { conteos: Record<string, number> }) {
  const { t, texto } = useTheme();
  const entradas = Object.entries(conteos);
  if (entradas.length === 0) return null;

  return (
    <View style={estilos.lista}>
      {entradas.map(([origen, cantidad]) => (
        <View key={origen} style={estilos.filaDeLista}>
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            {ETIQUETA_DE_ORIGEN[origen] ?? origen}
          </Text>
          <Text style={[texto('body-sm'), { color: t['--text-strong'] }]}>{cantidad}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * El fin del período es exclusivo —termina donde empieza el siguiente—, así que
 * para mostrarlo se resta un día: decir "hasta el lunes 14" cuando el período
 * cubre hasta el domingo 13 sería correr una semana entera.
 */
function rangoLegible(desde: string, hasta: string): string {
  const formato = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' });
  const fin = new Date(new Date(hasta).getTime() - 24 * 60 * 60 * 1000);
  return `${formato.format(new Date(desde))} al ${formato.format(fin)}`;
}

const estilos = StyleSheet.create({
  raiz: { gap: 12 },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  toggle: { flexDirection: 'row', gap: 8 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  bloque: { flex: 1, minWidth: 280, gap: 6 },
  lista: { gap: 2, marginTop: 4 },
  filaDeLista: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
