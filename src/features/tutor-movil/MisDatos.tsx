import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ActualizarTutorEntrada, TipoDocumento } from '../../api/tutor';
import { Badge, Button, InlineError, Input, Select, SkeletonText } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { useSesion } from '../../hooks/useSesion';
import { sombra, useTheme } from '../../theme';
import { FormularioDeContrasena } from '../cuenta';
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
  const { sesion } = useSesion();
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);

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

        {/*
          La contraseña es un dato de la cuenta como el teléfono, y va donde el
          tutor ya está mirando sus datos. En su propia tarjeta y no entre los
          campos de la ficha: se guardan por separado y con otro botón.
        */}
        {sesion?.usuario ? (
          <View
            style={[
              estilos.tarjeta,
              estilos.tarjetaSuelta,
              sombra('--shadow-sm'),
              {
                marginHorizontal: px('--gutter-mobile'),
                borderRadius: px('--radius-card'),
                backgroundColor: t['--surface-card'],
                borderColor: t['--border-default'],
                padding: px('--gutter-card'),
              },
            ]}
          >
            <Text style={[texto('h3'), { color: t['--text-strong'] }]}>Contraseña</Text>
            {!cambiandoContrasena ? (
              <View style={estilos.fila}>
                <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                  {sesion.usuario.tiene_contrasena
                    ? 'Definida. Cambiala cuando quieras.'
                    : 'Todavía no tenés una: entrás con Google.'}
                </Text>
                <Button variant="secondary" size="sm" onPress={() => setCambiandoContrasena(true)}>
                  {sesion.usuario.tiene_contrasena ? 'Cambiar' : 'Definir una'}
                </Button>
              </View>
            ) : (
              <FormularioDeContrasena
                usuarioId={sesion.usuario.id}
                tieneContrasena={sesion.usuario.tiene_contrasena}
                onListo={() => setCambiandoContrasena(false)}
                onCancelar={() => setCambiandoContrasena(false)}
              />
            )}
          </View>
        ) : null}
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
  // Vive fuera del contenedor con padding, así que se pone el suyo.
  tarjetaSuelta: { marginBottom: 24 },
});
