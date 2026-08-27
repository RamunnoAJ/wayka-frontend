import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ActualizarTutorEntrada, TipoDocumento } from '../../api/tutor';
import { Badge, Button, InlineError, Input, Select, SkeletonText } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';
import { useActualizarTutor, useTutor } from '../tutor/queries';
import { TIPOS_DE_DOCUMENTO } from '../veterinario/FormularioDeVeterinario';

import { useMiTutorID } from './queries';

/**
 * Mis datos (Alcance de Plataformas, 5.8).
 *
 * El tutor edita su nombre, contacto, dirección y documento. **No puede darse de
 * baja** —eso lo decide la clínica, que es quien tiene pacientes vinculados— ni
 * revocar el consentimiento por esta vía: la ley exige rastro del otorgamiento,
 * no una baja silenciosa (Modelo de Datos, 4.1).
 */
export function MisDatos() {
  const { t, px, texto } = useTheme();
  const tutorId = useMiTutorID();
  const consulta = useTutor(tutorId);
  const guardar = useActualizarTutor(tutorId ?? '');

  const [tocado, setTocado] = useState<ActualizarTutorEntrada>({});
  const [guardado, setGuardado] = useState(false);

  if (consulta.isPending || !tutorId) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <SkeletonText lines={4} />
      </View>
    );
  }
  if (consulta.isError) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <InlineError title="No se pudieron cargar tus datos" onRetry={() => consulta.refetch()} />
      </View>
    );
  }

  const tutor = consulta.data;
  const valores: ActualizarTutorEntrada = {
    nombre: tutor.nombre,
    contacto: tutor.contacto,
    tipo_documento: tutor.tipo_documento ?? 'dni',
    numero_documento: tutor.numero_documento ?? '',
    direccion: tutor.direccion ?? '',
    ...tocado,
  };

  function cambiar(campos: ActualizarTutorEntrada) {
    setTocado((previo) => ({ ...previo, ...campos }));
    setGuardado(false);
  }

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Mis datos</Text>

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
            <Input
              label="Dirección"
              value={valores.direccion ?? ''}
              onChangeText={(valor) => cambiar({ direccion: valor })}
              autoCapitalize="sentences"
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
            disabled={Object.keys(tocado).length === 0}
            loading={guardar.isPending}
            onPress={() =>
              guardar.mutate(tocado, {
                onSuccess: () => {
                  setTocado({});
                  setGuardado(true);
                },
              })
            }
          >
            Guardar
          </Button>

          <View style={estilos.consentimiento}>
            <Badge tone={tutor.consentimiento_datos ? 'success' : 'danger'}>
              {tutor.consentimiento_datos ? 'Consentimiento otorgado' : 'Sin consentimiento'}
            </Badge>
            <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
              El consentimiento de uso de datos se otorga al registrarse y no se cambia desde acá.
              Si querés revocarlo, escribinos.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  cargando: { padding: 24, gap: 12 },
  contenido: { paddingVertical: 24, gap: 16 },
  tarjeta: { borderWidth: 1, gap: 14 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 2, flexBasis: 180, minWidth: 160 },
  campoChico: { flexGrow: 1, flexBasis: 150, minWidth: 140 },
  consentimiento: { gap: 8 },
});
