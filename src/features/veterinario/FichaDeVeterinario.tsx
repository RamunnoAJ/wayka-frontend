import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ActualizarVeterinarioEntrada, TipoDocumento } from '../../api/veterinario';
import { Button, InlineError, Input, Select, Skeleton } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';

import { TIPOS_DE_DOCUMENTO } from './FormularioDeVeterinario';
import { useActualizarVeterinario, usePlantel } from './queries';

/**
 * Edición de una ficha del plantel (Alcance de Plataformas, 3.2).
 *
 * No hay endpoint de ficha individual: el plantel de una clínica está acotado y
 * el listado ya lo trae entero, así que la ficha se resuelve contra la query que
 * ya está en caché en vez de pedir lo mismo de nuevo.
 *
 * El email y la contraseña **no se editan acá**: viven en la entidad Usuario, no
 * en la ficha, y tienen su propio endpoint.
 */
export function FichaDeVeterinario({ veterinarioId }: { veterinarioId: string }) {
  const { t, px, texto } = useTheme();
  const plantel = usePlantel();
  const guardar = useActualizarVeterinario();
  const [tocado, setTocado] = useState<ActualizarVeterinarioEntrada>({});
  const [guardado, setGuardado] = useState(false);

  const veterinario = plantel.data?.find((v) => v.id === veterinarioId);

  if (plantel.isPending) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <Skeleton height={26} width="40%" />
        <Skeleton height={56} />
        <Skeleton height={56} />
      </View>
    );
  }

  if (plantel.isError) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <InlineError title="No se pudo cargar el plantel" onRetry={() => plantel.refetch()} />
      </View>
    );
  }

  if (!veterinario) {
    return (
      <View style={[estilos.raiz, estilos.cargando, { backgroundColor: t['--surface-page'] }]}>
        <Text style={[texto('h3'), { color: t['--text-strong'] }]}>
          Esta ficha no está en tu plantel
        </Text>
        <Text style={[texto('body'), { color: t['--text-muted'] }]}>
          Puede que se haya dado de baja, o que pertenezca a otra clínica.
        </Text>
      </View>
    );
  }

  const valores: ActualizarVeterinarioEntrada = {
    nombre: veterinario.nombre,
    tipo_documento: veterinario.tipo_documento,
    numero_documento: veterinario.numero_documento,
    matricula: veterinario.matricula ?? '',
    ...tocado,
  };

  function cambiar(campos: ActualizarVeterinarioEntrada) {
    setTocado((previo) => ({ ...previo, ...campos }));
    setGuardado(false);
  }

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View
          style={[
            estilos.contenido,
            { maxWidth: px('--content-max'), paddingHorizontal: px('--gutter-page') },
          ]}
        >
          <View style={estilos.titulo}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>{veterinario.nombre}</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              El correo y la contraseña de su cuenta se cambian aparte: son de la cuenta, no de la
              ficha.
            </Text>
          </View>

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
              label="Nombre y apellido"
              value={valores.nombre ?? ''}
              onChangeText={(valor) => cambiar({ nombre: valor })}
              autoCapitalize="words"
            />
            <View style={estilos.fila}>
              <View style={estilos.campoChico}>
                <Select
                  label="Tipo de documento"
                  options={TIPOS_DE_DOCUMENTO}
                  value={(valores.tipo_documento ?? 'dni') as TipoDocumento}
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
            {/* Vaciarla es una operación con sentido: deja la ficha en modo
                restringido sin dar de baja a la persona (regla 2.1). */}
            <Input
              label="Matrícula"
              hint="Vacía deja la cuenta sin poder cargar ni editar historial ni medicación."
              value={valores.matricula ?? ''}
              onChangeText={(valor) => cambiar({ matricula: valor })}
              autoCapitalize="characters"
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
            <Text style={[texto('body-sm'), { color: t['--text-success'] }]}>
              Cambios guardados.
            </Text>
          ) : null}

          <Button
            size="lg"
            disabled={Object.keys(tocado).length === 0 || !valores.nombre?.trim()}
            loading={guardar.isPending}
            onPress={() =>
              guardar.mutate(
                { id: veterinarioId, cambios: tocado },
                {
                  onSuccess: () => {
                    setTocado({});
                    setGuardado(true);
                  },
                },
              )
            }
          >
            Guardar cambios
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  cargando: { padding: 32, gap: 12 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 20 },
  titulo: { gap: 6, maxWidth: 640 },
  tarjeta: { borderWidth: 1, gap: 14 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 2, flexBasis: 200, minWidth: 180 },
  campoChico: { flexGrow: 1, flexBasis: 160, minWidth: 150 },
});
