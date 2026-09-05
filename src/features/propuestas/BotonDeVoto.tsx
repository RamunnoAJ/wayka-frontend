import { StyleSheet, Text, View } from 'react-native';

import { Icon, Presionable } from '../../components';
import { ESCALA_DE_PRESION } from '../../theme/movimiento';
import { useTheme } from '../../theme';

interface BotonDeVotoProps {
  votos: number;
  votada: boolean;
  enCurso: boolean;
  onPress: () => void;
  titulo: string;
}

/**
 * El voto, en columna: la flecha arriba y el número abajo. Es lo que hace que la
 * columna de números se lea de un vistazo sin recorrer tarjeta por tarjeta.
 *
 * **El contador no se mueve mientras el voto está en curso.** Decir "se está
 * registrando" —el control deshabilitado— es honesto; mostrar un número que
 * puede volver atrás, no. La contrapartida asumida es que con red lenta el
 * botón tarda en encenderse.
 */
export function BotonDeVoto({ votos, votada, enCurso, onPress, titulo }: BotonDeVotoProps) {
  const { t, px, texto } = useTheme();

  return (
    <Presionable
      onPress={onPress}
      disabled={enCurso}
      escala={ESCALA_DE_PRESION}
      fondo={votada ? t['--color-primary-soft'] : t['--surface-card']}
      borde={votada ? t['--color-primary-strong'] : t['--border-default']}
      accessibilityLabel={
        votada ? `Sacar mi voto a “${titulo}”. ${votos} votos` : `Votar “${titulo}”. ${votos} votos`
      }
      accessibilityState={{ selected: votada, disabled: enCurso }}
      style={[estilos.boton, { borderRadius: px('--radius-md'), opacity: enCurso ? 0.6 : 1 }]}
    >
      <View style={estilos.contenido}>
        <Icon
          name="chevron-up"
          size={18}
          color={votada ? t['--color-primary-strong'] : t['--text-muted']}
        />
        <Text
          style={[
            texto('body-strong'),
            { color: votada ? t['--color-primary-strong'] : t['--text-body'] },
          ]}
        >
          {votos}
        </Text>
      </View>
    </Presionable>
  );
}

const estilos = StyleSheet.create({
  boton: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10, minWidth: 52 },
  contenido: { alignItems: 'center', gap: 2 },
});
