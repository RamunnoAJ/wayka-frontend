import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ActualizarTutorEntrada, TipoDocumento } from '../../api/tutor';
import {
  Badge,
  Button,
  EmptyState,
  InlineError,
  Input,
  Select,
  SkeletonText,
} from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';
import { CampoDeDireccion, cambioDeDireccion, direccionDeFicha } from '../direccion';
import type { Direccion } from '../direccion';
import { useGuardarFichaDelTutor } from '../sincronizacion';
import { TIPOS_DE_DOCUMENTO } from '../veterinario/FormularioDeVeterinario';

import { useMiFicha, useMiTutorID } from './queries';

/**
 * Ficha propia del tutor, primer bloque de Ajustes (Alcance de Plataformas, 5.8).
 *
 * El tutor edita su nombre, contacto, dirección y documento. **No puede darse de
 * baja** —eso lo decide la clínica, que es quien tiene pacientes vinculados— ni
 * revocar el consentimiento por esta vía: la ley exige rastro del otorgamiento,
 * no una baja silenciosa (Modelo de Datos, 4.1).
 *
 * Es un bloque y no una pantalla: no lleva scroll ni padding propios, los pone
 * `Ajustes`. Sus estados de falla tampoco ofrecen salir de la sesión — el botón
 * vive abajo de todo, en el bloque de cuenta, y por eso sigue estando aunque la
 * ficha no cargue.
 */
export function MisDatos() {
  const { t, px, texto } = useTheme();
  const tutorId = useMiTutorID();
  const consulta = useMiFicha(tutorId);
  // La escritura entra a la cola en el dispositivo y va directo en web: es la
  // misma llamada desde la pantalla, y por eso el formulario no cambia.
  const guardar = useGuardarFichaDelTutor(consulta.data);

  const [tocado, setTocado] = useState<ActualizarTutorEntrada>({});
  // La dirección se lleva aparte del resto de los campos tocados porque son
  // cuatro valores que viajan como un bloque: mezclarlos en el mismo objeto
  // haría que borrar el texto dejara el punto suelto (regla 2.6).
  const [direccionTocada, setDireccionTocada] = useState<Direccion | null>(null);
  const [guardado, setGuardado] = useState(false);

  // Una cuenta de tutor sin ficha vinculada no se arregla esperando ni
  // reintentando: lo único que le queda a esa persona es salir y volver a entrar
  // con otra cuenta. Por eso no es el mismo estado que "todavía cargando".
  if (!tutorId) {
    return (
      <View style={estilos.estado}>
        <EmptyState
          icon="user-round"
          title="Tu cuenta no tiene una ficha de tutor"
          description="Escribinos para que la vinculemos. Mientras tanto no hay datos que mostrar acá."
        />
      </View>
    );
  }
  if (consulta.isPending) {
    return (
      <View style={estilos.estado}>
        <SkeletonText lines={4} />
      </View>
    );
  }
  if (consulta.isError) {
    return (
      <View style={estilos.estado}>
        <InlineError title="No se pudieron cargar tus datos" onRetry={() => consulta.refetch()} />
      </View>
    );
  }

  // En el dispositivo la ficha sale de la copia local, que está vacía hasta la
  // primera sincronización. No es un error —no hay nada que reintentar contra el
  // servidor— pero tampoco hay datos que mostrar, así que se dice tal cual.
  const tutor = consulta.data;
  if (!tutor) {
    return (
      <View style={estilos.estado}>
        <EmptyState
          icon="refresh-cw"
          title="Todavía no descargamos tus datos"
          description="Conectate a internet un momento y tus datos van a aparecer acá."
        />
      </View>
    );
  }

  const valores: ActualizarTutorEntrada = {
    nombre: tutor.nombre,
    contacto: tutor.contacto,
    tipo_documento: tutor.tipo_documento ?? 'dni',
    numero_documento: tutor.numero_documento ?? '',
    ...tocado,
  };
  const direccion = direccionTocada ?? direccionDeFicha(tutor);

  function cambiar(campos: ActualizarTutorEntrada) {
    setTocado((previo) => ({ ...previo, ...campos }));
    setGuardado(false);
  }

  return (
    <View style={estilos.bloque}>
      <Text style={[texto('h2'), { color: t['--text-strong'] }]}>Mis datos</Text>

      <View
        style={[
          estilos.tarjeta,
          sombra('--shadow-sm'),
          {
            borderRadius: px('--radius-card'),
            backgroundColor: t['--surface-card'],
            borderColor: t['--border-default'],
            padding: px('--gutter-card'),
          },
        ]}
      >
        <Input
          label="Nombre completo"
          value={valores.nombre ?? ''}
          onChangeText={(valor) => cambiar({ nombre: valor })}
          autoCapitalize="words"
        />
        <Input
          label="Contacto"
          hint="Por acá te ubica la veterinaria."
          value={valores.contacto ?? ''}
          onChangeText={(valor) => cambiar({ contacto: valor })}
        />
        <View style={estilos.fila}>
          <View style={estilos.campoChico}>
            <Select
              label="Tipo de documento"
              options={TIPOS_DE_DOCUMENTO}
              value={(valores.tipo_documento || 'dni') as TipoDocumento}
              onChange={(valor) => cambiar({ tipo_documento: valor })}
            />
          </View>
          <View style={estilos.campo}>
            <Input
              label="Número de documento"
              value={valores.numero_documento ?? ''}
              onChangeText={(valor) => cambiar({ numero_documento: valor })}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <CampoDeDireccion
          value={direccion}
          onChange={(nueva) => {
            setDireccionTocada(nueva);
            setGuardado(false);
          }}
        />
      </View>

      {guardar.isError ? (
        <InlineError
          compact
          title="No se pudo guardar"
          description={mensajeDeError(guardar.error)}
        />
      ) : null}
      {guardado ? (
        <Text style={[texto('body-sm'), { color: t['--text-success'] }]}>Datos guardados.</Text>
      ) : null}

      <Button
        size="touch"
        block
        disabled={Object.keys(tocado).length === 0 && direccionTocada === null}
        loading={guardar.isPending}
        onPress={() =>
          guardar.mutate(
            { ...tocado, ...(direccionTocada ? cambioDeDireccion(direccionTocada) : {}) },
            {
              onSuccess: () => {
                setTocado({});
                setDireccionTocada(null);
                setGuardado(true);
              },
            },
          )
        }
      >
        Guardar
      </Button>

      <View style={estilos.consentimiento}>
        <Badge tone={tutor.consentimiento_datos ? 'success' : 'danger'}>
          {tutor.consentimiento_datos ? 'Consentimiento otorgado' : 'Sin consentimiento'}
        </Badge>
        <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
          El consentimiento de uso de datos se otorga al registrarse y no se cambia desde acá. Si
          querés revocarlo, escribinos.
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: 16 },
  estado: { gap: 12 },
  tarjeta: { borderWidth: 1, gap: 14 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 2, flexBasis: 180, minWidth: 160 },
  campoChico: { flexGrow: 1, flexBasis: 150, minWidth: 140 },
  consentimiento: { gap: 8 },
});
