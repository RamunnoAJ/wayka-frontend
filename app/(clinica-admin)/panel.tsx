import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EntradaDePantalla } from '../../src/components';
import { Tablero } from '../../src/features/tablero';
import { useSesion } from '../../src/hooks/useSesion';
import { useTheme } from '../../src/theme';

/**
 * Panel del clínica_admin (Alcance de Plataformas, 3.2.1): el tablero y nada
 * más.
 *
 * Es lo único de la sección que se mira todos los días. El horario, las
 * ausencias, el plantel y los datos de la clínica tienen su propia pantalla: son
 * cosas que se tocan cuando hay algo que cambiar, y apiladas acá enterraban el
 * tablero abajo de tres formularios.
 *
 * No hay acceso a historial ni medicación: el rol alcanza datos administrativos
 * y conteos, no las mascotas atendidas.
 */
export default function Panel() {
  const { t, px, texto } = useTheme();
  const { sesion } = useSesion();
  const clinicaId = sesion?.usuario.clinica_id ?? undefined;

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
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Panel</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              Cómo viene la clínica: la agenda, lo que se atendió y la cartera.
            </Text>
          </View>

          {clinicaId ? (
            <Tablero clinicaId={clinicaId} />
          ) : (
            <Text style={[texto('body'), { color: t['--text-muted'] }]}>
              Tu cuenta no tiene una clínica asociada. Es un dato que se define al dar de alta la
              clínica y no se puede corregir desde acá.
            </Text>
          )}
        </View>
      </ScrollView>
    </EntradaDePantalla>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { width: '100%', alignSelf: 'center', paddingVertical: 32, gap: 24 },
  titulo: { gap: 6 },
});
