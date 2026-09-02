import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EntradaDePantalla } from '../../src/components';
import { EditorDeHorario } from '../../src/features/clinica';
import { useSesion } from '../../src/hooks/useSesion';
import { useTheme } from '../../src/theme';

/**
 * Horario de atención (Alcance de Plataformas, 3.2.3).
 *
 * Tiene pantalla propia y no un bloque del panel porque es la más densa de la
 * sección —siete días, con sus tramos— y porque se toca poco: mezclarla con el
 * tablero enterraría abajo de un formulario lo único que se mira todos los días.
 */
export default function Horario() {
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
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Horario de atención</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              La grilla con la que agenda todo el equipo. Cambiarla cambia qué horas son válidas en
              el calendario de la clínica.
            </Text>
          </View>

          {clinicaId ? (
            <EditorDeHorario clinicaId={clinicaId} />
          ) : (
            <Text style={[texto('body'), { color: t['--text-muted'] }]}>
              Tu cuenta no tiene una clínica asociada.
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
