import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EntradaDePantalla } from '../../src/components';
import { Ausencias as PanelDeAusencias } from '../../src/features/ausencias';
import { useMiClinica } from '../../src/features/clinica';
import { useTheme } from '../../src/theme';

/**
 * Ausencias del plantel (Alcance de Plataformas, 3.2.4).
 *
 * Va aparte del horario aunque las dos definan quién atiende cuándo: el horario
 * se configura una vez y una ausencia se carga cada semana, muchas veces con
 * apuro. Compartir pantalla haría que la tarea frecuente viva abajo de la que
 * casi no se toca.
 */
export default function Ausencias() {
  const { t, px, texto } = useTheme();
  const clinica = useMiClinica();

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
            <Text style={[texto('h1'), { color: t['--text-strong'] }]}>Ausencias del plantel</Text>
            <Text style={[texto('body-lg'), { color: t['--text-muted'] }]}>
              Quién no va a estar y cuándo, para que la agenda no le ofrezca turnos.
            </Text>
          </View>

          <PanelDeAusencias zonaHoraria={clinica.data?.zona_horaria} />
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
