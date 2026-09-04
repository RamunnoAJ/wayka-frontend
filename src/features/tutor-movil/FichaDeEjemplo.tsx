import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Icon } from '../../components';
import { sombra, useTheme } from '../../theme';

/**
 * La ficha de ejemplo del estado vacío (Alcance de Plataformas, 5.2).
 *
 * Antes de pedirle que cargue nada, la pantalla **muestra qué va a tener**: un
 * tutor que todavía no vio una ficha no sabe qué está por armar, y un formulario
 * en frío le pide trabajo contra una promesa que no puede evaluar.
 *
 * **Es un mock del cliente y no toca el backend**: no persiste, no crea una
 * mascota, no se comparte y no se edita. La pantalla lo dice sin ambigüedad —
 * una ficha de demostración que se confunda con una real es peor que no tenerla.
 */
const ANTECEDENTES_DE_EJEMPLO = [
  { etiqueta: 'Vacuna', detalle: 'Antirrábica · 2023' },
  { etiqueta: 'Alergia', detalle: 'Pollo · leve' },
  { etiqueta: 'Control', detalle: 'Consulta · marzo de 2024' },
];

export function FichaDeEjemplo() {
  const { t, px, texto } = useTheme();

  return (
    <View
      accessibilityLabel="Ficha de ejemplo"
      style={[
        estilos.raiz,
        sombra('--shadow-sm'),
        {
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <View style={estilos.aclaracion}>
        <Icon name="eye" size={14} color={t['--text-subtle']} />
        <Text style={[texto('overline'), { color: t['--text-subtle'] }]}>
          ASÍ SE VE UNA FICHA · EJEMPLO
        </Text>
      </View>

      <View style={estilos.identidad}>
        <Avatar name="Malbec" species="canino" size="lg" />
        <View style={estilos.flexible}>
          <Text style={[texto('h4'), { color: t['--text-strong'] }]}>Malbec</Text>
          <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
            Labrador · 4 años · 28,4 kg
          </Text>
        </View>
      </View>

      <View style={estilos.filas}>
        {ANTECEDENTES_DE_EJEMPLO.map((antecedente) => (
          <View key={antecedente.etiqueta} style={estilos.fila}>
            <Badge tone="neutral" size="sm">
              {antecedente.etiqueta}
            </Badge>
            <Text style={[texto('body-sm'), { color: t['--text-muted'], flex: 1 }]}>
              {antecedente.detalle}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[texto('caption'), { color: t['--text-subtle'] }]}>
        Es una mascota inventada, para mostrar cómo queda. La tuya va a tener su historial de
        verdad, con lo que escriba cada veterinaria que la atienda.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { borderWidth: 1, padding: 14, gap: 12 },
  aclaracion: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  identidad: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filas: { gap: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flexible: { flex: 1, minWidth: 0, gap: 2 },
});
