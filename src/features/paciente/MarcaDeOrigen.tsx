import { StyleSheet, Text, View } from 'react-native';

import { loDeclaroElTutor, type RegistroDelHistorial } from '../../api/historial';
import { Badge, Icon } from '../../components';
import { useTheme } from '../../theme';

/**
 * Distingue un antecedente que declaró el tutor de un registro que escribió un
 * profesional. **No es decoración: es contrato** (Modelo de Datos, 4.5).
 *
 * Tres cosas que no se negocian, y las tres tienen su motivo:
 *
 * - **Lleva texto.** Un ícono chico o un color distinto no alcanzan: un
 *   veterinario ajeno que lee la banda de urgencia en treinta segundos tiene que
 *   saber qué está mirando sin buscarlo, y el color solo además deja afuera a
 *   quien no lo distingue.
 * - **Nombra al autor y no juzga el dato.** Dice "lo declaró el tutor", nunca
 *   "sin verificar": el registro no está mal, lo declaró otra persona. No hay
 *   proceso de validación en el modelo y la interfaz no puede inventar uno.
 * - **Solo se marca lo del tutor.** Lo que escribió el profesional es el caso
 *   normal del historial y marcarlo también convertiría la marca en ruido, que
 *   es la forma más rápida de que deje de leerse.
 */

interface MarcaProps {
  registro: RegistroDelHistorial;
  /**
   * En la banda de urgencia y dentro de una tarjeta de medicación el espacio es
   * de una línea. Se acorta el texto, nunca se cae.
   */
  compacta?: boolean;
}

export function MarcaDeOrigen({ registro, compacta = false }: MarcaProps) {
  const { t, texto } = useTheme();

  if (!loDeclaroElTutor(registro)) return null;

  if (compacta) {
    return (
      <View style={estilos.compacta}>
        <Icon name="user-round" size={12} color={t['--text-subtle']} />
        <Text style={[texto('caption'), { fontWeight: '600', color: t['--text-subtle'] }]}>
          Lo declaró el tutor
        </Text>
      </View>
    );
  }

  return (
    <Badge tone="info" icon="user-round" size="sm">
      Lo declaró el tutor
    </Badge>
  );
}

const estilos = StyleSheet.create({
  compacta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
