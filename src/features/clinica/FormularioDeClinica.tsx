import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ActualizarClinicaEntrada, Clinica } from '../../api/clinica';

import { horaDeMinutos, minutosDeHora } from './grilla';
import {
  Button,
  InlineError,
  Input,
  Select,
  Skeleton,
  type OpcionDeSelect,
} from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';

import { useActualizarClinica, useClinica } from './queries';

/**
 * Datos administrativos de la clínica y su horario de atención (Alcance de
 * Plataformas, 3.2).
 *
 * Los tres campos de horario definen la grilla con la que agenda toda la
 * clínica, así que un cambio acá cambia qué horas son válidas en el calendario
 * de todos. El backend rechaza el que deje citas pendientes afuera; la pantalla
 * muestra ese motivo tal cual en vez de un "no se pudo guardar".
 */
const HORAS: OpcionDeSelect[] = Array.from({ length: 24 * 2 }, (_, i) => {
  const hora = horaDeMinutos(i * 30);
  return { value: hora, label: hora };
});

const DURACIONES: OpcionDeSelect[] = [15, 20, 30, 45, 60].map((minutos) => ({
  value: String(minutos),
  label: `${minutos} min`,
}));

interface FormularioProps {
  clinicaId: string;
  /** Texto del botón: cambia entre el panel y la puesta en marcha. */
  etiquetaGuardar?: string;
  onGuardado?: (clinica: Clinica) => void;
}

export function FormularioDeClinica({
  clinicaId,
  etiquetaGuardar = 'Guardar cambios',
  onGuardado,
}: FormularioProps) {
  const { t, px, texto } = useTheme();
  const consulta = useClinica(clinicaId);
  const guardar = useActualizarClinica(clinicaId);

  // El borrador guarda **solo lo tocado** y se superpone a lo que trajo el
  // servidor. Sembrarlo entero en un efecto obligaría a sincronizar dos fuentes
  // de verdad y a pisar lo que el usuario está escribiendo en cada refetch.
  const [tocado, setTocado] = useState<ActualizarClinicaEntrada>({});

  if (consulta.isPending) {
    return (
      <View style={estilos.cargando}>
        <Skeleton height={26} width="40%" />
        <Skeleton height={56} />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </View>
    );
  }

  if (consulta.isError) {
    return (
      <InlineError
        title="No se pudieron cargar los datos de la clínica"
        onRetry={() => consulta.refetch()}
      />
    );
  }

  const borrador: ActualizarClinicaEntrada = {
    nombre: consulta.data.nombre,
    direccion: consulta.data.direccion,
    contacto: consulta.data.contacto,
    hora_apertura: consulta.data.hora_apertura,
    hora_cierre: consulta.data.hora_cierre,
    duracion_turno_minutos: consulta.data.duracion_turno_minutos,
    ...tocado,
  };

  const apertura = minutosDeHora(borrador.hora_apertura ?? '00:00');
  const cierre = minutosDeHora(borrador.hora_cierre ?? '00:00');
  const duracion = borrador.duracion_turno_minutos ?? 0;
  const intervalo = cierre - apertura;

  // Las mismas dos reglas que aplica el backend (2.2), replicadas para no
  // mandar un guardado que ya sabemos que se rechaza.
  const errorDeHorario = (() => {
    if (intervalo <= 0) return 'El cierre tiene que ser posterior a la apertura.';
    if (duracion <= 0) return 'Elegí una duración de turno.';
    if (intervalo % duracion !== 0) {
      return `Un turno de ${duracion} min no divide de forma exacta el horario: el último quedaría cortado por el cierre.`;
    }
    return undefined;
  })();

  const completo =
    borrador.nombre?.trim() && borrador.direccion?.trim() && borrador.contacto?.trim();

  const turnosPorDia = errorDeHorario ? 0 : Math.floor(intervalo / duracion);

  function cambiar(campos: ActualizarClinicaEntrada) {
    setTocado((previo) => ({ ...previo, ...campos }));
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
          DATOS DE LA CLÍNICA
        </Text>
        <Input
          label="Nombre"
          value={borrador.nombre ?? ''}
          onChangeText={(valor) => cambiar({ nombre: valor })}
          autoCapitalize="words"
        />
        <View style={estilos.fila}>
          <View style={estilos.campoAncho}>
            <Input
              label="Dirección"
              value={borrador.direccion ?? ''}
              onChangeText={(valor) => cambiar({ direccion: valor })}
              autoCapitalize="sentences"
            />
          </View>
          <View style={estilos.campo}>
            <Input
              label="Contacto"
              value={borrador.contacto ?? ''}
              onChangeText={(valor) => cambiar({ contacto: valor })}
            />
          </View>
        </View>
      </View>

      <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
        <Text style={[texto('overline'), { fontWeight: '700', color: t['--text-subtle'] }]}>
          HORARIO DE ATENCIÓN
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Definen la grilla con la que agenda toda la clínica. Es un horario único para toda la
          semana: el MVP no modela corte de mediodía ni horario por día.
        </Text>

        <View style={estilos.fila}>
          <View style={estilos.campo}>
            <Select
              label="Abre"
              options={HORAS}
              value={borrador.hora_apertura ?? '09:00'}
              onChange={(valor) => cambiar({ hora_apertura: valor })}
            />
          </View>
          <View style={estilos.campo}>
            <Select
              label="Cierra"
              options={HORAS}
              value={borrador.hora_cierre ?? '18:00'}
              onChange={(valor) => cambiar({ hora_cierre: valor })}
            />
          </View>
          <View style={estilos.campo}>
            <Select
              label="Duración del turno"
              options={DURACIONES}
              value={String(duracion)}
              onChange={(valor) => cambiar({ duracion_turno_minutos: Number(valor) })}
            />
          </View>
        </View>

        {errorDeHorario ? (
          <InlineError compact title="El horario no cierra" description={errorDeHorario} />
        ) : (
          <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
            {`Entran ${turnosPorDia} turnos por día.`}
          </Text>
        )}
      </View>

      {guardar.isError ? (
        <InlineError
          compact
          title="No se pudo guardar"
          description={mensajeDeError(guardar.error)}
        />
      ) : null}

      <Button
        size="lg"
        disabled={Boolean(errorDeHorario) || !completo}
        loading={guardar.isPending}
        onPress={() => guardar.mutate(borrador, { onSuccess: (clinica) => onGuardado?.(clinica) })}
      >
        {etiquetaGuardar}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 16 },
  cargando: { gap: 12 },
  bloque: { gap: 12 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 1, flexBasis: 160, minWidth: 150 },
  campoAncho: { flexGrow: 2, flexBasis: 240, minWidth: 200 },
});
