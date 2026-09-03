import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CrearPacienteEntrada, Paciente } from '../../api/paciente';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  InlineError,
  Input,
  Presionable,
  SkeletonText,
} from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';

import { capitalizar, edad, peso } from './formato';
import { FormularioDeAltaDePaciente } from './FormularioDeAlta';
import { useCrearPaciente, usePacientes } from './queries';

/**
 * Cartera de pacientes de la clínica (Alcance de Plataformas, 3.3).
 *
 * A diferencia de la búsqueda de tutores, este listado **sí arranca mostrando
 * todo**: es la cartera de una sola clínica y el veterinario la recorre, no solo
 * la consulta. La búsqueda filtra sobre eso.
 */
interface ListadoProps {
  onAbrir: (paciente: Paciente) => void;
}

export function ListadoDePacientes({ onAbrir }: ListadoProps) {
  const { t, px, texto } = useTheme();
  const [escrito, setEscrito] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);

  const pacientes = usePacientes({ busqueda: busqueda || undefined, limite: 100 });
  const crear = useCrearPaciente();

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
              <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Pacientes</Text>
              <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
                Las mascotas que atiende tu clínica.
              </Text>
            </View>
            <Button iconLeft="plus" onPress={() => setAbierto((v) => !v)}>
              Alta de paciente
            </Button>
          </View>

          {abierto ? (
            <FormularioDeAltaDePaciente
              enviando={crear.isPending}
              error={crear.error ? mensajeDeError(crear.error) : undefined}
              onGuardar={(entrada: CrearPacienteEntrada) =>
                crear.mutate(entrada, {
                  onSuccess: (paciente) => {
                    setAbierto(false);
                    onAbrir(paciente);
                  },
                })
              }
              onCancelar={() => setAbierto(false)}
            />
          ) : null}

          <View style={estilos.buscador}>
            <View style={estilos.campo}>
              <Input
                label="Buscar por nombre"
                placeholder="Luna"
                value={escrito}
                onChangeText={setEscrito}
                onSubmitEditing={() => setBusqueda(escrito.trim())}
                returnKeyType="search"
                autoCapitalize="words"
              />
            </View>
            <Button variant="secondary" onPress={() => setBusqueda(escrito.trim())}>
              Buscar
            </Button>
            {busqueda ? (
              <Button
                variant="ghost"
                onPress={() => {
                  setEscrito('');
                  setBusqueda('');
                }}
              >
                Ver todos
              </Button>
            ) : null}
          </View>

          {pacientes.isPending ? (
            <View style={estilos.lista}>
              <SkeletonText lines={4} />
            </View>
          ) : pacientes.isError ? (
            <InlineError title="No se pudo cargar la cartera" onRetry={() => pacientes.refetch()} />
          ) : (pacientes.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon="paw-print"
              title={
                busqueda ? `Ninguna mascota se llama "${busqueda}"` : 'Todavía no hay pacientes'
              }
              description={
                busqueda
                  ? 'Probá con otro nombre, o dala de alta si es la primera vez que viene.'
                  : 'Dá de alta la primera mascota: se crea junto con la ficha de su tutor si todavía no existe.'
              }
              action={
                <Button iconLeft="plus" onPress={() => setAbierto(true)}>
                  Alta de paciente
                </Button>
              }
            />
          ) : (
            <View style={estilos.lista}>
              {pacientes.data?.map((paciente) => (
                <Presionable
                  key={paciente.id}
                  onPress={() => onAbrir(paciente)}
                  fondo={t['--surface-card']}
                  fondoDestacado={t['--surface-hover']}
                  borde={t['--border-default']}
                  style={[
                    estilos.tarjeta,
                    sombra('--shadow-sm'),
                    { borderRadius: px('--radius-card') },
                  ]}
                >
                  <Avatar
                    name={paciente.nombre}
                    species={paciente.especie}
                    src={paciente.foto_perfil_url}
                    size="md"
                  />
                  <View style={estilos.flexible}>
                    <Text style={[texto('body-strong'), { color: t['--text-strong'] }]}>
                      {paciente.nombre}
                    </Text>
                    <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
                      {[
                        capitalizar(paciente.raza),
                        capitalizar(paciente.sexo),
                        edad(paciente.fecha_nacimiento),
                      ].join(' · ')}
                    </Text>
                  </View>
                  <Badge tone="neutral">{peso(paciente.peso_actual)}</Badge>
                </Presionable>
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
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  titulo: { flex: 1, minWidth: 240, gap: 6 },
  buscador: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 },
  campo: { flexGrow: 1, flexBasis: 260, minWidth: 200 },
  lista: { gap: 12 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 14 },
  flexible: { flex: 1, minWidth: 160, gap: 2 },
});
