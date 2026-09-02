import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EntradaDePantalla, InlineError, Skeleton } from '../../../../../src/components';
import { useClinica } from '../../../../../src/features/clinica/queries';
import { FormularioDeEvento } from '../../../../../src/features/paciente/FormularioDeEvento';
import {
  useActualizarEvento,
  useCitas,
  useEventosClinicos,
  useMiFichaDeVeterinario,
  usePaciente,
} from '../../../../../src/features/paciente/queries';
import { mensajeDeError } from '../../../../../src/lib/errores';
import { useTheme } from '../../../../../src/theme';

/**
 * Corrección de un evento clínico ya firmado (Reglas de Negocio, 3.2).
 *
 * Cualquier veterinario de la clínica corrige el de un colega: `veterinario_id`
 * conserva la autoría y no se reasigna nunca, y la Auditoría registra quién
 * editó qué. Lo que **no** se cambia es el tipo — la API lo omite de la entrada,
 * y cambiarlo sería reescribir qué se hizo en vez de corregir cómo se escribió.
 *
 * Los adjuntos no se tocan acá: cuelgan del evento y se administran desde su
 * sección, que es donde se los mira.
 */
export default function EditarEventoClinico() {
  const { id, eventoId } = useLocalSearchParams<{ id: string; eventoId: string }>();
  const { t, px, texto } = useTheme();

  const paciente = usePaciente(id);
  const eventos = useEventosClinicos(id);
  const citas = useCitas(id);
  const miFicha = useMiFichaDeVeterinario();
  const clinica = useClinica(miFicha.data?.clinica_id);
  const actualizar = useActualizarEvento(id);

  // El evento sale del listado que la ficha ya tiene cacheado: no hay endpoint
  // de lectura por id, y pedir el historial entero es lo mismo que ya se hizo.
  const evento = eventos.data?.find((candidato) => candidato.id === eventoId);

  return (
    <EntradaDePantalla style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View
          style={[
            estilos.contenido,
            { maxWidth: px('--content-max'), paddingHorizontal: px('--gutter-page') },
          ]}
        >
          <View style={estilos.titulo}>
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Corregir el evento</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              {paciente.data
                ? `En el historial de ${paciente.data.nombre}. Queda quién lo escribió y quién lo corrigió.`
                : 'Queda quién lo escribió y quién lo corrigió.'}
            </Text>
          </View>

          {eventos.isPending ? (
            <View style={estilos.cargando}>
              <Skeleton height={56} />
              <Skeleton height={120} />
            </View>
          ) : eventos.isError ? (
            <InlineError title="No se pudo cargar el historial" onRetry={() => eventos.refetch()} />
          ) : !evento ? (
            <InlineError
              title="Ese evento ya no está en el historial"
              description="Puede que alguien lo haya dado de baja mientras tanto."
            />
          ) : (
            <FormularioDeEvento
              enviando={actualizar.isPending}
              error={actualizar.error ? mensajeDeError(actualizar.error) : undefined}
              citas={citas.data}
              clinica={clinica.data}
              valorInicial={evento}
              onGuardar={({ tipo: _tipo, ...entrada }) =>
                actualizar.mutate({ eventoId, entrada }, { onSuccess: () => router.back() })
              }
              onCancelar={() => router.back()}
            />
          )}
        </View>
      </ScrollView>
    </EntradaDePantalla>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 20 },
  titulo: { gap: 6, maxWidth: 640 },
  cargando: { gap: 12, maxWidth: 640 },
});
