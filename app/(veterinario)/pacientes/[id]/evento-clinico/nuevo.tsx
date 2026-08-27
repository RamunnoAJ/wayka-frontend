import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormularioDeEvento } from '../../../../../src/features/paciente/FormularioDeEvento';
import { useCrearEvento, usePaciente } from '../../../../../src/features/paciente/queries';
import { mensajeDeError } from '../../../../../src/lib/errores';
import { useTheme } from '../../../../../src/theme';

/** Carga de evento clínico (Alcance de Plataformas, 3.4). */
export default function NuevoEventoClinico() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, px, texto } = useTheme();
  const paciente = usePaciente(id);
  const crear = useCrearEvento(id);

  function volver() {
    router.back();
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
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Cargar evento clínico</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              {paciente.data
                ? `En el historial de ${paciente.data.nombre}.`
                : 'En el historial del paciente.'}
            </Text>
          </View>

          <FormularioDeEvento
            enviando={crear.isPending}
            error={crear.error ? mensajeDeError(crear.error) : undefined}
            onGuardar={(entrada) => crear.mutate(entrada, { onSuccess: volver })}
            onCancelar={volver}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 20 },
  titulo: { gap: 6, maxWidth: 640 },
});
