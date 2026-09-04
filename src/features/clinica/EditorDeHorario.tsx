import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  DIAS_DE_LA_SEMANA,
  NOMBRE_DEL_DIA,
  type DiaDeLaSemana,
  type FranjaDeAtencion,
  type PrevisualizacionDeGrilla,
} from '../../api/clinica';
import { Button, InlineError, Select, Skeleton, type OpcionDeSelect } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';
import { momentoCorto } from '../paciente/formato';

import { horaDeMinutos, minutosDeHora } from './grilla';
import { estaCerradaTodaLaSemana, validarFranjas } from './horario';
import {
  useActualizarClinica,
  useEscribirGrilla,
  useGrilla,
  usePrevisualizarGrilla,
} from './queries';

/**
 * Horario de atención de la clínica (Alcance de Plataformas, 3.2.3).
 *
 * Se edita la semana entera y se guarda de una vez: la grilla es una sola cosa y
 * el backend la valida completa. Un día sin ningún tramo es un día cerrado, y la
 * pantalla lo dice con esas palabras en vez de dejar el día vacío y ambiguo.
 */
const HORAS: OpcionDeSelect[] = Array.from({ length: 24 * 4 }, (_, i) => {
  const hora = horaDeMinutos(i * 15);
  return { value: hora, label: hora };
});

const DURACIONES: OpcionDeSelect[] = [15, 20, 30, 45, 60].map((minutos) => ({
  value: String(minutos),
  label: `${minutos} min`,
}));

interface Props {
  clinicaId: string;
}

export function EditorDeHorario({ clinicaId }: Props) {
  const { t, px, texto } = useTheme();
  const consulta = useGrilla(clinicaId);
  const guardar = useEscribirGrilla(clinicaId);
  const previsualizar = usePrevisualizarGrilla(clinicaId);
  const guardarDuracion = useActualizarClinica(clinicaId);

  // El borrador arranca en null y se siembra con lo del servidor recién cuando
  // se toca algo: así un refetch no pisa lo que la persona está editando.
  const [borrador, setBorrador] = useState<FranjaDeAtencion[] | null>(null);

  if (consulta.isPending) {
    return (
      <View style={estilos.cargando}>
        <Skeleton height={26} width="40%" />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </View>
    );
  }

  if (consulta.isError) {
    return (
      <InlineError
        title="No se pudo cargar el horario de atención"
        onRetry={() => consulta.refetch()}
      />
    );
  }

  const duracion = consulta.data.duracion_turno_minutos;
  const franjas = borrador ?? consulta.data.franjas;
  const errores = validarFranjas(franjas, duracion);
  const cerradaEntera = estaCerradaTodaLaSemana(franjas);
  const hayCambios = borrador !== null;

  function cambiar(siguiente: FranjaDeAtencion[]) {
    setBorrador(siguiente);
    // La previsualización que se está mostrando corresponde al horario anterior:
    // dejarla en pantalla diría que el efecto ya calculado sigue valiendo.
    previsualizar.reset();
  }

  function delDia(dia: DiaDeLaSemana): FranjaDeAtencion[] {
    return franjas
      .filter((franja) => franja.dia_semana === dia)
      .sort((una, otra) => minutosDeHora(una.hora_desde) - minutosDeHora(otra.hora_desde));
  }

  function agregarTramo(dia: DiaDeLaSemana) {
    const existentes = delDia(dia);
    const ultimo = existentes.at(-1);
    // El tramo nuevo arranca una hora después del cierre del anterior, no pegado:
    // pegados son un solo tramo escrito en dos, y el backend los rechaza.
    const desde = ultimo ? Math.min(minutosDeHora(ultimo.hora_hasta) + 60, 22 * 60) : 9 * 60;
    cambiar([
      ...franjas,
      {
        dia_semana: dia,
        hora_desde: horaDeMinutos(desde),
        hora_hasta: horaDeMinutos(Math.min(desde + 4 * 60, 24 * 60 - 15)),
      },
    ]);
  }

  function quitarTramo(dia: DiaDeLaSemana, posicion: number) {
    const objetivo = delDia(dia)[posicion];
    cambiar(franjas.filter((franja) => franja !== objetivo));
  }

  function editarTramo(dia: DiaDeLaSemana, posicion: number, campos: Partial<FranjaDeAtencion>) {
    const objetivo = delDia(dia)[posicion];
    cambiar(franjas.map((franja) => (franja === objetivo ? { ...franja, ...campos } : franja)));
  }

  const tarjeta = {
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
    padding: px('--gutter-card'),
  };

  return (
    <View style={estilos.raiz}>
      <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
        <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
          HORARIO DE ATENCIÓN
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Un día sin ningún tramo es un día cerrado, y dos tramos con un hueco en el medio son el
          corte de mediodía.
        </Text>

        {/*
          La duración va acá y no con los datos administrativos: los dos definen
          la grilla y se validan uno contra el otro. Se guarda sola al elegirla,
          porque los tramos de abajo se validan contra la duración **guardada** —
          arrastrarla en el mismo borrador dejaría el editor midiendo con una
          regla que el servidor todavía no conoce.
        */}
        <View style={estilos.duracion}>
          <View style={estilos.campo}>
            <Select
              label="Duración del turno"
              options={DURACIONES}
              value={String(duracion)}
              onChange={(valor) =>
                guardarDuracion.mutate({ duracion_turno_minutos: Number(valor) })
              }
            />
          </View>
        </View>

        {guardarDuracion.isError ? (
          <InlineError
            compact
            title="No se pudo cambiar la duración del turno"
            description={mensajeDeError(guardarDuracion.error)}
          />
        ) : null}

        {DIAS_DE_LA_SEMANA.map((dia) => {
          const tramos = delDia(dia);
          const erroresDelDia = errores.filter((error) => error.dia === dia);
          return (
            <View
              key={dia}
              style={[estilos.dia, { borderTopColor: t['--border-subtle'] }]}
              testID={`dia-${dia}`}
            >
              <View style={estilos.encabezadoDelDia}>
                <Text style={[texto('body'), { fontWeight: '600', color: t['--text-strong'] }]}>
                  {NOMBRE_DEL_DIA[dia]}
                </Text>
                <Button variant="ghost" size="sm" iconLeft="plus" onPress={() => agregarTramo(dia)}>
                  Agregar tramo
                </Button>
              </View>

              {tramos.length === 0 ? (
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  Cerrado. No se puede agendar ningún turno este día.
                </Text>
              ) : (
                tramos.map((tramo, posicion) => (
                  <View key={`${dia}-${posicion}`} style={estilos.tramo}>
                    <View style={estilos.campo}>
                      <Select
                        label="Abre"
                        options={HORAS}
                        value={tramo.hora_desde}
                        onChange={(valor) => editarTramo(dia, posicion, { hora_desde: valor })}
                      />
                    </View>
                    <View style={estilos.campo}>
                      <Select
                        label="Cierra"
                        options={HORAS}
                        value={tramo.hora_hasta}
                        onChange={(valor) => editarTramo(dia, posicion, { hora_hasta: valor })}
                      />
                    </View>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft="trash-2"
                      onPress={() => quitarTramo(dia, posicion)}
                    >
                      Quitar
                    </Button>
                  </View>
                ))
              )}

              {erroresDelDia.map((error) => (
                <Text
                  key={`${error.dia}-${error.posicion}-${error.mensaje}`}
                  style={[texto('body-sm'), { color: t['--text-danger'] }]}
                >
                  {error.mensaje}
                </Text>
              ))}
            </View>
          );
        })}

        {cerradaEntera ? (
          <InlineError
            compact
            title="La clínica quedaría cerrada toda la semana"
            description="Sin ningún tramo no se puede agendar nada. Dejá al menos un día abierto."
          />
        ) : null}
      </View>

      {previsualizar.data ? (
        <Efecto previsualizacion={previsualizar.data} zonaHoraria={consulta.data.zona_horaria} />
      ) : null}

      {previsualizar.isError ? (
        <InlineError
          compact
          title="No se pudo calcular el efecto"
          description={mensajeDeError(previsualizar.error)}
        />
      ) : null}

      {guardar.isError ? (
        <InlineError
          compact
          title="No se pudo guardar el horario"
          description={mensajeDeError(guardar.error)}
        />
      ) : null}

      <View style={estilos.acciones}>
        {/*
          La previsualización va antes que guardar y no como el texto de un
          error: achicar el horario se rechaza mientras haya citas pendientes
          afuera, y descubrirlo recién al fallar obliga a corregir a ciegas hasta
          que el guardado deje de fallar (Alcance de Plataformas, 3.2.3).
        */}
        <Button
          variant="secondary"
          disabled={errores.length > 0 || cerradaEntera}
          loading={previsualizar.isPending}
          onPress={() => previsualizar.mutate({ franjas })}
        >
          Ver el efecto
        </Button>
        <Button
          size="lg"
          disabled={!hayCambios || errores.length > 0 || cerradaEntera}
          loading={guardar.isPending}
          onPress={() => guardar.mutate({ franjas }, { onSuccess: () => setBorrador(null) })}
        >
          Guardar el horario
        </Button>
      </View>
    </View>
  );
}

/**
 * Qué pasaría si esa grilla se guardara. Los turnos por día son los siete,
 * incluido el cero de un día cerrado: omitirlo dejaría a quien mira adivinando
 * si el día está cerrado o si el número no se calculó.
 */
function Efecto({
  previsualizacion,
  zonaHoraria,
}: {
  previsualizacion: PrevisualizacionDeGrilla;
  zonaHoraria: string | undefined;
}) {
  const { t, px, texto } = useTheme();
  const afuera = previsualizacion.citas_que_quedan_afuera;

  return (
    <View
      style={[
        estilos.bloque,
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-hover'],
          borderColor: t['--border-default'],
          borderWidth: 1,
          padding: px('--gutter-card'),
        },
      ]}
    >
      <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
        CON ESTE HORARIO
      </Text>
      <View style={estilos.turnos}>
        {previsualizacion.turnos_por_dia.map((dia) => (
          <Text key={dia.dia_semana} style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            {`${NOMBRE_DEL_DIA[dia.dia_semana]}: ${dia.turnos === 0 ? 'cerrado' : `${dia.turnos} turnos`}`}
          </Text>
        ))}
      </View>

      {afuera.length === 0 ? (
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          No hay ninguna cita pendiente que quede fuera de la grilla.
        </Text>
      ) : (
        <>
          <InlineError
            compact
            title={
              afuera.length === 1
                ? '1 cita pendiente quedaría sin turno donde existir'
                : `${afuera.length} citas pendientes quedarían sin turno donde existir`
            }
            description="Guardar se va a rechazar hasta que se reagenden. No se cancelan ni se mueven solas: mover la agenda de una mascota es una decisión clínica."
          />
          {/*
            Cuáles son, y no solo cuántas: sin los horarios hay que corregir la
            grilla a ciegas hasta que el guardado deje de fallar, que es
            exactamente lo que la previsualización vino a evitar.
          */}
          <ScrollView style={estilos.afuera}>
            {/* Dos citas pueden caer en el mismo instante: el índice desempata. */}
            {afuera.map((horario, i) => (
              <Text key={`${horario}-${i}`} style={[texto('body-sm'), { color: t['--text-body'] }]}>
                {momentoCorto(horario, zonaHoraria)}
              </Text>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 16 },
  bloque: { gap: 12 },
  cargando: { gap: 12 },
  dia: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  encabezadoDelDia: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tramo: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 },
  campo: { flex: 1, minWidth: 140 },
  turnos: { gap: 2 },
  // Todas las citas afectadas entran, sin que el bloque crezca sin límite.
  afuera: { maxHeight: 132 },
  duracion: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
});
