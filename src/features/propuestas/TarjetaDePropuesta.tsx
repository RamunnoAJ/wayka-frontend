import { StyleSheet, Text, View } from 'react-native';

import type { Propuesta } from '../../api/propuesta';
import { sombra, useTheme } from '../../theme';

import { BotonDeVoto } from './BotonDeVoto';
import { EtiquetaDeEstado } from './EtiquetaDeEstado';

interface TarjetaDePropuestaProps {
  propuesta: Propuesta;
  enCurso: boolean;
  onVotar: () => void;
}

/**
 * El voto a la izquierda y el texto a la derecha. No hay pantalla de detalle: la
 * propuesta entera —título, detalle y estado— entra en la tarjeta, y votar es la
 * única acción que existe.
 */
export function TarjetaDePropuesta({ propuesta, enCurso, onVotar }: TarjetaDePropuestaProps) {
  const { t, px, texto } = useTheme();

  return (
    <View
      style={[
        estilos.tarjeta,
        sombra('--shadow-sm'),
        {
          borderRadius: px('--radius-card'),
          padding: px('--gutter-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <BotonDeVoto
        votos={propuesta.votos}
        votada={propuesta.ya_vote}
        enCurso={enCurso}
        onPress={onVotar}
        titulo={propuesta.titulo}
      />
      <View style={estilos.flexible}>
        <EtiquetaDeEstado estado={propuesta.estado} />
        <Text style={[texto('body-strong'), { color: t['--text-body'] }]}>{propuesta.titulo}</Text>
        {propuesta.descripcion ? (
          <Text style={[texto('body'), { color: t['--text-muted'] }]}>{propuesta.descripcion}</Text>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1 },
  flexible: { flex: 1, gap: 6, alignItems: 'flex-start' },
});
