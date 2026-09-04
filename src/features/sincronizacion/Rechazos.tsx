import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Cita } from '../../api/cita';
import { PRECISION_DE_FECHA } from '../../api/historial';
import type { Paciente } from '../../api/paciente';
import { Badge, Button, EmptyState, InlineError, SkeletonText } from '../../components';
import { sombra, useTheme } from '../../theme';
import { capitalizar, fechaConPrecision, momentoCorto, peso } from '../paciente/formato';

import type { MutacionEnCola } from './almacen';
import {
  useDescartarRechazo,
  useEncolarCambioDeCita,
  useRechazos,
  useRegistroLocal,
} from './queries';

/**
 * Cambios que no se pudieron aplicar (doc 11, sección 7).
 *
 * Cada uno se muestra con su motivo y con el valor que quedó en el servidor.
 * **Nada se reintenta solo**: un rechazo significa que las condiciones
 * cambiaron, y mandar lo mismo de nuevo pide la misma respuesta otra vez. La
 * pantalla existe para que el tutor decida: volver a intentar con otro valor, o
 * descartar el cambio.
 */
export function Rechazos() {
  const { t, px, texto } = useTheme();
  const rechazos = useRechazos();

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Cambios sin aplicar</Text>

          {rechazos.isPending ? (
            <SkeletonText lines={3} />
          ) : rechazos.isError ? (
            <InlineError
              title="No se pudieron leer los cambios pendientes"
              onRetry={() => rechazos.refetch()}
            />
          ) : (rechazos.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon="check"
              title="No hay nada pendiente"
              description="Todo lo que escribiste sin conexión llegó a la clínica."
            />
          ) : (
            <View style={estilos.lista}>
              {rechazos.data?.map((rechazo) => (
                <TarjetaDeRechazo key={rechazo.id_mutacion} rechazo={rechazo} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function TarjetaDeRechazo({ rechazo }: { rechazo: MutacionEnCola }) {
  const { t, px, texto } = useTheme();
  const descartar = useDescartarRechazo();

  return (
    <View
      style={[
        estilos.tarjeta,
        sombra('--shadow-sm'),
        {
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
          borderRadius: px('--radius-card'),
        },
      ]}
    >
      <View style={estilos.encabezado}>
        <Text style={[texto('h4'), { color: t['--text-strong'] }]}>{titulo(rechazo)}</Text>
        <Badge tone="danger">No se aplicó</Badge>
      </View>

      <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
        {rechazo.motivo?.mensaje ?? 'El cambio no se pudo aplicar.'}
      </Text>

      <LoQueSeQuisoCargar rechazo={rechazo} />
      <ValorEnElServidor rechazo={rechazo} />
      <Alternativas rechazo={rechazo} />

      {/*
        Corregir va primero y descartar queda de salida: descartar es tirar el
        único lugar donde el dato estaba escrito, porque `marcarRechazada` ya
        borró el registro provisional (Sincronización sin Conexión, 6).
      */}
      {esAntecedente(rechazo) ? (
        <Button
          onPress={() =>
            router.push(`/(tutor)/mascotas/${rechazo.entidad_id}/antecedentes` as never)
          }
        >
          Corregir y volver a cargar
        </Button>
      ) : null}
      <Button variant="ghost" onPress={() => descartar.mutate(rechazo.id_mutacion)}>
        Descartar este cambio
      </Button>
    </View>
  );
}

function esAntecedente(rechazo: MutacionEnCola): boolean {
  return (
    rechazo.tipo === 'cargar_antecedente_clinico' ||
    rechazo.tipo === 'cargar_antecedente_de_medicacion'
  );
}

/**
 * Lo que el tutor había escrito. La cola es el único lugar donde quedó: el
 * registro provisional se borró al marcar el rechazo, así que sin esto
 * "descartar" tira un dato que nadie llegó a ver de nuevo.
 */
function LoQueSeQuisoCargar({ rechazo }: { rechazo: MutacionEnCola }) {
  const { t, px, texto } = useTheme();

  const lineas = rechazo.evento_clinico
    ? [
        capitalizar(rechazo.evento_clinico.tipo),
        fechaConPrecision(
          rechazo.evento_clinico.fecha,
          rechazo.evento_clinico.fecha_precision ?? PRECISION_DE_FECHA.DIA,
        ),
        rechazo.evento_clinico.descripcion,
      ]
    : rechazo.medicacion
      ? [
          rechazo.medicacion.nombre_droga,
          fechaConPrecision(
            rechazo.medicacion.fecha_inicio,
            rechazo.medicacion.fecha_precision ?? PRECISION_DE_FECHA.DIA,
          ),
          [rechazo.medicacion.dosis, rechazo.medicacion.frecuencia].filter(Boolean).join(' · '),
        ]
      : [];

  const visibles = lineas.filter(Boolean);
  if (visibles.length === 0) return null;

  return (
    <View
      style={{
        gap: 2,
        padding: px('--gutter-card'),
        borderRadius: px('--radius-card'),
        backgroundColor: t['--surface-sunken'],
      }}
    >
      <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
        LO QUE ESCRIBISTE
      </Text>
      {visibles.map((linea) => (
        <Text key={linea} style={[texto('body-sm'), { color: t['--text-body'] }]}>
          {linea}
        </Text>
      ))}
    </View>
  );
}

/**
 * El valor que quedó del otro lado. Sin esto, "el registro cambió" no le dice al
 * tutor qué pasó con su cambio ni contra qué está decidiendo.
 */
function ValorEnElServidor({ rechazo }: { rechazo: MutacionEnCola }) {
  const { t, texto } = useTheme();
  const paciente = useRegistroLocal<Paciente>('paciente', enPaciente(rechazo));
  const cita = useRegistroLocal<Cita>('cita', enCita(rechazo));

  const actual =
    paciente.data != null
      ? `Ahora figura ${peso(paciente.data.peso_actual)}`
      : cita.data != null
        ? `Ahora figura para el ${momentoCorto(cita.data.fecha_programada)}`
        : null;

  if (!actual) return null;
  return <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>{actual}</Text>;
}

/**
 * Los horarios que sí estaban libres. Es la diferencia entre "no se pudo" y "no
 * se pudo, pero tenés estos": sin ellos, el tutor vuelve a elegir a ciegas
 * contra un calendario que su teléfono puede tener desactualizado.
 */
function Alternativas({ rechazo }: { rechazo: MutacionEnCola }) {
  const { t, texto } = useTheme();
  const cita = useRegistroLocal<Cita>('cita', enCita(rechazo));
  const reintentar = useEncolarCambioDeCita();

  const alternativas = rechazo.motivo?.alternativas ?? [];
  if (alternativas.length === 0 || !cita.data) return null;

  return (
    <View style={estilos.alternativas}>
      <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>Horarios disponibles:</Text>
      {alternativas.map((momento) => (
        <Button
          key={momento}
          variant="secondary"
          size="sm"
          onPress={() =>
            reintentar.mutate({
              cita: cita.data as Cita,
              cambios: { fecha_programada: momento },
            })
          }
        >
          {momentoCorto(momento)}
        </Button>
      ))}
    </View>
  );
}

function enPaciente(rechazo: MutacionEnCola): string | undefined {
  return rechazo.tipo === 'actualizar_peso_de_paciente' ? rechazo.entidad_id : undefined;
}

function enCita(rechazo: MutacionEnCola): string | undefined {
  return rechazo.tipo === 'actualizar_cita' || rechazo.tipo === 'retirar_cita'
    ? rechazo.entidad_id
    : undefined;
}

function titulo(rechazo: MutacionEnCola): string {
  switch (rechazo.tipo) {
    case 'actualizar_peso_de_paciente':
      return 'El peso que anotaste';
    case 'actualizar_ficha_de_tutor':
      return 'Tus datos';
    case 'actualizar_cita':
      return 'El cambio de turno';
    case 'retirar_cita':
      return 'La cita que quisiste retirar';
    case 'cargar_antecedente_clinico':
      return 'El antecedente que cargaste';
    case 'cargar_antecedente_de_medicacion':
      return 'La medicación que anotaste';
  }
}

const estilos = StyleSheet.create({
  alternativas: { gap: 8 },
  contenido: { gap: 16, paddingBottom: 32, paddingTop: 16 },
  encabezado: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  lista: { gap: 12 },
  raiz: { flex: 1 },
  tarjeta: { borderWidth: 1, gap: 12, padding: 16 },
});
