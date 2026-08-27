import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Tutor } from '../../api/tutor';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  InlineError,
  Input,
  SkeletonText,
} from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';

import { FormularioDeTutor } from './FormularioDeTutor';
import { useBuscarTutores, useCrearTutor } from './queries';

/**
 * Búsqueda y alta de fichas de tutor (Alcance de Plataformas, 3.3).
 *
 * La búsqueda es el paso 2 del alta de paciente: antes de crear una ficha hay
 * que ver si la persona ya está. Por eso no arranca listando todo — un listado
 * de todas las fichas del sistema no ayuda a encontrar a nadie — y por eso el
 * alta se ofrece desde el vacío de la búsqueda, con el nombre ya escrito.
 */
interface BuscadorProps {
  /** Al elegir un tutor: abrir su ficha, o devolverlo al alta de paciente. */
  onElegir: (tutor: Tutor) => void;
}

export function BuscadorDeTutores({ onElegir }: BuscadorProps) {
  const { t, px, texto } = useTheme();
  const [texto_, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);

  const resultados = useBuscarTutores({ busqueda: busqueda || undefined, limite: 50 });
  const crear = useCrearTutor();

  function buscar() {
    setBusqueda(texto_.trim());
    setAbierto(false);
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
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Tutores</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              Buscá por nombre, teléfono o correo antes de crear una ficha nueva. La búsqueda
              alcanza todo el sistema, no solo tu clínica.
            </Text>
          </View>

          <View style={estilos.buscador}>
            <View style={estilos.campo}>
              <Input
                label="Buscar"
                placeholder="María Pérez, o su teléfono"
                value={texto_}
                onChangeText={setTexto}
                onSubmitEditing={buscar}
                returnKeyType="search"
                autoCapitalize="words"
              />
            </View>
            <Button onPress={buscar} disabled={!texto_.trim()}>
              Buscar
            </Button>
          </View>

          {abierto ? (
            <FormularioDeTutor
              nombreInicial={busqueda}
              enviando={crear.isPending}
              error={crear.error ? mensajeDeError(crear.error) : undefined}
              onGuardar={(entrada) =>
                crear.mutate(entrada, {
                  onSuccess: (tutor) => {
                    setAbierto(false);
                    onElegir(tutor);
                  },
                })
              }
              onCancelar={() => setAbierto(false)}
            />
          ) : null}

          {!busqueda ? (
            <EmptyState
              icon="user-round"
              title="Buscá a la persona antes de crearla"
              description="Puede tener ficha desde otra clínica, o haberse registrado por su cuenta desde la app."
            />
          ) : resultados.isPending ? (
            <View style={estilos.lista}>
              <SkeletonText lines={3} />
            </View>
          ) : resultados.isError ? (
            <InlineError title="No se pudo buscar" onRetry={() => resultados.refetch()} />
          ) : (resultados.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon="user-round"
              title={`Nadie coincide con "${busqueda}"`}
              description="Si es la primera vez que viene, creá su ficha ahora."
              action={
                <Button iconLeft="plus" onPress={() => setAbierto(true)}>
                  Crear ficha de tutor
                </Button>
              }
            />
          ) : (
            <View style={estilos.lista}>
              <View style={estilos.resumen}>
                <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
                  {`${resultados.data?.length} coincidencia${resultados.data?.length === 1 ? '' : 's'}`}
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft="plus"
                  onPress={() => setAbierto(true)}
                >
                  Ninguno es: crear ficha
                </Button>
              </View>

              {resultados.data?.map((tutor) => (
                <Pressable
                  key={tutor.id}
                  accessibilityRole="button"
                  onPress={() => onElegir(tutor)}
                  style={({ hovered, pressed }) => [
                    estilos.tarjeta,
                    sombra('--shadow-sm'),
                    {
                      borderRadius: px('--radius-card'),
                      borderColor: t['--border-default'],
                      backgroundColor:
                        hovered || pressed ? t['--surface-hover'] : t['--surface-card'],
                    },
                  ]}
                >
                  <Avatar name={tutor.nombre} size="md" tone="brand" />
                  <View style={estilos.flexible}>
                    <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                      {tutor.nombre}
                    </Text>
                    <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
                      {tutor.contacto}
                    </Text>
                  </View>
                  {tutor.numero_documento ? (
                    <Badge tone="neutral">
                      {`${(tutor.tipo_documento ?? '').toUpperCase()} ${tutor.numero_documento}`}
                    </Badge>
                  ) : (
                    <Badge tone="warning">Sin documento</Badge>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 20 },
  titulo: { gap: 6, maxWidth: 640 },
  buscador: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 1, flexBasis: 280, minWidth: 220 },
  lista: { gap: 12 },
  resumen: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 14 },
  flexible: { flex: 1, minWidth: 160, gap: 2 },
});
