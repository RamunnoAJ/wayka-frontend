import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ActualizarTutorEntrada, TipoDocumento } from '../../api/tutor';
import { Badge, Button, InlineError, Input, Select, Skeleton } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { TIPOS_DE_DOCUMENTO } from '../veterinario/FormularioDeVeterinario';
import { sombra, useTheme } from '../../theme';

import { useActualizarTutor, useDarDeBajaTutor, useTutor } from './queries';

/**
 * Ficha de tutor: lectura, edición y baja lógica (Alcance de Plataformas, 3.3).
 *
 * Leerla exige vínculo con la clínica —que el tutor tenga un paciente vigente
 * ahí, o que la ficha la haya creado esa clínica (Reglas de Negocio, 3.2)—, así
 * que un resultado de la búsqueda global puede terminar en 403. La pantalla lo
 * dice en esos términos en vez de mostrar un error genérico.
 */
export function FichaDeTutor({ tutorId }: { tutorId: string }) {
  const { t, px, texto } = useTheme();
  const consulta = useTutor(tutorId);
  const guardar = useActualizarTutor(tutorId);
  const darDeBaja = useDarDeBajaTutor();

  const [tocado, setTocado] = useState<ActualizarTutorEntrada>({});
  const [confirmando, setConfirmando] = useState(false);

  if (consulta.isPending) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <Skeleton height={26} width="40%" />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </View>
    );
  }

  if (consulta.isError) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <InlineError
          title="No se pudo abrir esta ficha"
          description="Para verla completa tu clínica tiene que estar vinculada: que la persona tenga una mascota vigente acá, o que la ficha la hayan creado ustedes. Buscala de nuevo y dale de alta una mascota primero."
          onRetry={() => consulta.refetch()}
        />
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
  }

  const tarjeta = {
    borderRadius: px('--radius-card'),
    backgroundColor: t['--surface-card'],
    borderColor: t['--border-default'],
    borderWidth: 1,
    padding: px('--gutter-card'),
  };

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
              <Text style={[texto('h1'), { color: t['--text-strong'] }]}>{tutor.nombre}</Text>
              <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>{tutor.contacto}</Text>
            </View>
            {/* El consentimiento se muestra pero no se edita: se otorga en el
                alta y la ley exige rastro, no una baja silenciosa (4.1). */}
            <Badge tone={tutor.consentimiento_datos ? 'success' : 'danger'}>
              {tutor.consentimiento_datos ? 'Consentimiento otorgado' : 'Sin consentimiento'}
            </Badge>
          </View>

          <View style={[tarjeta, sombra('--shadow-sm'), estilos.bloque]}>
            <Input
              label="Nombre completo"
              value={valores.nombre ?? ''}
              onChangeText={(valor) => cambiar({ nombre: valor })}
              autoCapitalize="words"
            />
            <Input
              label="Contacto"
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
                  hint={
                    tutor.numero_documento ? undefined : 'Completalo ahora que lo tenés a mano.'
                  }
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

          <View style={estilos.acciones}>
            <Button
              size="lg"
              disabled={Object.keys(tocado).length === 0}
              loading={guardar.isPending}
              onPress={() => guardar.mutate(tocado, { onSuccess: () => setTocado({}) })}
            >
              Guardar cambios
            </Button>
            {!confirmando ? (
              <Button variant="ghost" iconLeft="archive" onPress={() => setConfirmando(true)}>
                Dar de baja
              </Button>
            ) : null}
          </View>

          {confirmando ? (
            <View style={[tarjeta, estilos.bloque, { borderColor: t['--border-danger'] }]}>
              <Text style={[texto('body-strong'), { color: t['--text-danger'] }]}>
                Dar de baja esta ficha
              </Text>
              {/* Regla 2.4: se rechaza mientras tenga mascotas vigentes. Se
                  anticipa el motivo en vez de dejar que el 409 lo explique. */}
              <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
                Si todavía tiene mascotas activas en alguna clínica, el sistema lo va a rechazar:
                dejarlas sin nadie a quien contactar no es una opción. Su cuenta de la app no se
                borra.
              </Text>
              {darDeBaja.isError ? (
                <InlineError
                  compact
                  title="No se pudo dar de baja"
                  description={mensajeDeError(darDeBaja.error)}
                />
              ) : null}
              <View style={estilos.acciones}>
                <Button
                  variant="danger"
                  loading={darDeBaja.isPending}
                  onPress={() => darDeBaja.mutate(tutorId)}
                >
                  Dar de baja
                </Button>
                <Button variant="ghost" onPress={() => setConfirmando(false)}>
                  Cancelar
                </Button>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  cargando: { padding: 32, gap: 12 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 20 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  titulo: { flex: 1, minWidth: 240, gap: 6 },
  bloque: { gap: 14 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 2, flexBasis: 200, minWidth: 180 },
  campoChico: { flexGrow: 1, flexBasis: 160, minWidth: 150 },
  acciones: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
});
