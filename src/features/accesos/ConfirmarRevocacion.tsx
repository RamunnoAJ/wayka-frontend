import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components';
import { useTheme } from '../../theme';

/**
 * Confirmación de una revocación.
 *
 * El copy **dice la verdad sobre el efecto** en vez de prometer un corte
 * instantáneo: en el servidor es inmediato, pero un teléfono sin señal puede
 * seguir mostrando lo que ya descargó hasta que se conecte (Sincronización sin
 * Conexión, 8). Ocultarlo sería peor que el problema — quien revoca merece saber
 * qué queda expuesto y por cuánto.
 *
 * Con una veterinaria no hace falta la aclaración: la copia local es del tutor,
 * y el veterinario trabaja siempre contra el servidor.
 */
export function ConfirmarRevocacion({
  nombre,
  nombreDeLaMascota,
  esPersona,
  enviando,
  onConfirmar,
  onCancelar,
}: {
  nombre: string;
  nombreDeLaMascota: string;
  esPersona: boolean;
  enviando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const { t, px, texto } = useTheme();

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancelar}>
      <View style={estilos.telon}>
        <View
          style={[
            estilos.tarjeta,
            {
              borderRadius: px('--radius-card'),
              backgroundColor: t['--surface-card'],
              borderColor: t['--border-default'],
            },
          ]}
        >
          <Text style={[texto('h4'), { color: t['--text-strong'] }]}>
            {esPersona ? `¿Quitarle el acceso a ${nombre}?` : `¿${nombre} deja de atenderla?`}
          </Text>

          <Text style={[texto('body'), { color: t['--text-muted'] }]}>
            {esPersona
              ? `Va a dejar de ver a ${nombreDeLaMascota} apenas su teléfono se conecte. Si está sin señal, puede seguir viendo lo que ya descargó.`
              : `Va a dejar de ver la ficha y el historial de ${nombreDeLaMascota}. Lo que ya escribió queda donde está, con su firma.`}
          </Text>

          <View style={estilos.acciones}>
            <Button block variant="danger" loading={enviando} onPress={onConfirmar}>
              {esPersona ? 'Quitar el acceso' : 'Quitar la veterinaria'}
            </Button>
            <Button block variant="ghost" onPress={onCancelar}>
              Cancelar
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  // Mismo telón que el desplegable del Select: el valor está a mano ahí y no hay
  // token de superposición en el sistema de diseño.
  telon: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(30,20,40,0.35)',
  },
  tarjeta: { borderWidth: 1, padding: 20, gap: 12 },
  acciones: { gap: 8, marginTop: 4 },
});
