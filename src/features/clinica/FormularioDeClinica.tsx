import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ActualizarClinicaEntrada, Clinica } from '../../api/clinica';

import {
  Button,
  InlineError,
  Input,
  Select,
  Skeleton,
  type OpcionDeSelect,
} from '../../components';
import { CampoDeDireccion, cambioDeDireccion, direccionDeFicha } from '../direccion';
import type { Direccion } from '../direccion';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';

import { useActualizarClinica, useClinica } from './queries';

/**
 * Datos administrativos de la clínica y la duración de su turno (Alcance de
 * Plataformas, 3.2.5).
 *
 * El horario de atención **no se edita acá**: son las franjas, se escriben
 * enteras y tienen su propio editor (`EditorDeHorario`). La duración del turno
 * sí, porque es de la clínica y no de la franja — cuánto dura atender a un
 * paciente no cambia porque sea martes a la mañana o jueves a la tarde.
 */
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
  // La dirección va aparte: son cuatro campos que se mandan como un bloque, y
  // mezclarlos con el resto del borrador haría que editar el texto arrastrara
  // el punto viejo (regla 2.6).
  const [direccionTocada, setDireccionTocada] = useState<Direccion | null>(null);

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
    contacto: consulta.data.contacto,
    duracion_turno_minutos: consulta.data.duracion_turno_minutos,
    ...tocado,
  };

  const duracion = borrador.duracion_turno_minutos ?? 0;

  const direccion = direccionTocada ?? direccionDeFicha(consulta.data);
  // Una clínica sin domicilio no se puede visitar: a diferencia de la ficha de
  // tutor, acá la dirección no se puede dejar vacía (regla 2.6).
  const completo = borrador.nombre?.trim() && direccion.texto.trim() && borrador.contacto?.trim();

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
            <CampoDeDireccion
              value={direccionTocada ?? direccionDeFicha(consulta.data)}
              onChange={setDireccionTocada}
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
          DURACIÓN DEL TURNO
        </Text>
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Cuánto dura atender a un paciente acá. Junto con el horario de atención define la grilla
          con la que agenda todo el equipo, así que cambiarla cambia qué horas son válidas.
        </Text>

        <View style={estilos.fila}>
          <View style={estilos.campo}>
            <Select
              label="Duración del turno"
              options={DURACIONES}
              value={String(duracion)}
              onChange={(valor) => cambiar({ duracion_turno_minutos: Number(valor) })}
            />
          </View>
        </View>
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
        disabled={!completo}
        loading={guardar.isPending}
        onPress={() =>
          guardar.mutate(
            { ...borrador, ...(direccionTocada ? cambioDeDireccion(direccionTocada) : {}) },
            { onSuccess: (clinica) => onGuardado?.(clinica) },
          )
        }
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
