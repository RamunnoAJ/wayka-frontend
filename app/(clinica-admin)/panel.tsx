import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../src/components';
import { FormularioDeClinica } from '../../src/features/clinica';
import { useSesion } from '../../src/hooks/useSesion';
import { useTheme } from '../../src/theme';

/**
 * Panel de clínica (Alcance de Plataformas, 3.2): datos administrativos y
 * horario de atención, más el acceso al plantel.
 *
 * La clínica no se da de alta ni de baja desde acá — eso lo hace el
 * administrador de la plataforma por fuera de la API (proceso 4.10). Y no hay
 * acceso a historial ni medicación: el rol alcanza datos administrativos, no las
 * mascotas atendidas.
 */
export default function Panel() {
  const { t, px, texto } = useTheme();
  const { sesion } = useSesion();
  const clinicaId = sesion?.usuario.clinica_id ?? undefined;

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
              <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Panel de clínica</Text>
              <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
                Los datos con los que te ven los tutores y el horario con el que agenda tu equipo.
              </Text>
            </View>
            <Button
              variant="secondary"
              iconLeft="user-round"
              onPress={() => router.push('/(clinica-admin)/veterinarios')}
            >
              Ver el plantel
            </Button>
          </View>

          {clinicaId ? (
            <FormularioDeClinica clinicaId={clinicaId} />
          ) : (
            <Text style={[texto('body'), { color: t['--text-muted'] }]}>
              Tu cuenta no tiene una clínica asociada. Escribinos: es un dato que se define al dar
              de alta la clínica y no se puede corregir desde acá.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 24 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  titulo: { flex: 1, minWidth: 260, gap: 6 },
});
