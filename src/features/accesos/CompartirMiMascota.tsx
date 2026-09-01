import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Presionable } from '../../components';
import { useTheme } from '../../theme';
import { mensajeDeError } from '../../lib/errores';

import { CompartirConClinica } from './CompartirConClinica';
import { InvitarCoTutor } from './InvitarCoTutor';
import { useCompartirConClinica, useInvitarCoTutor } from './queries';

/**
 * Compartir una mascota (Alcance de Plataformas, 5.9). Dos caminos en una sola
 * pantalla, porque son la misma decisión con dos destinatarios posibles.
 */
type Solapa = 'persona' | 'veterinaria';

export function CompartirMiMascota({
  pacienteId,
  nombreDeLaMascota,
  onListo,
}: {
  pacienteId: string;
  nombreDeLaMascota: string;
  onListo: () => void;
}) {
  const { t, px, texto } = useTheme();
  const [solapa, setSolapa] = useState<Solapa>('veterinaria');

  const compartir = useCompartirConClinica(pacienteId);
  const invitar = useInvitarCoTutor(pacienteId);

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          <Text style={[texto('h1'), { color: t['--text-strong'] }]}>
            {`Compartir a ${nombreDeLaMascota}`}
          </Text>

          <View style={estilos.solapas}>
            <Solapita
              activa={solapa === 'veterinaria'}
              onPress={() => setSolapa('veterinaria')}
              titulo="Con una veterinaria"
            />
            <Solapita
              activa={solapa === 'persona'}
              onPress={() => setSolapa('persona')}
              titulo="Con una persona"
            />
          </View>

          {solapa === 'veterinaria' ? (
            <CompartirConClinica
              enviando={compartir.isPending}
              error={compartir.error ? mensajeDeError(compartir.error) : undefined}
              onCompartir={(clinica) => compartir.mutate(clinica.id, { onSuccess: onListo })}
            />
          ) : (
            <InvitarCoTutor
              enviando={invitar.isPending}
              error={invitar.error ? mensajeDeError(invitar.error) : undefined}
              onInvitar={(entrada) => invitar.mutate(entrada, { onSuccess: onListo })}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Solapita({
  activa,
  titulo,
  onPress,
}: {
  activa: boolean;
  titulo: string;
  onPress: () => void;
}) {
  const { t, px, texto } = useTheme();
  return (
    <Presionable
      onPress={onPress}
      fondo={activa ? t['--surface-accent-soft'] : t['--surface-card']}
      fondoDestacado={t['--surface-hover']}
      borde={activa ? t['--color-primary-strong'] : t['--border-default']}
      accessibilityState={{ selected: activa }}
      style={[estilos.solapa, { borderRadius: px('--radius-md') }]}
    >
      <Text
        style={[
          texto('body-strong'),
          { color: activa ? t['--color-primary-strong'] : t['--text-muted'] },
        ]}
      >
        {titulo}
      </Text>
    </Presionable>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingVertical: 24, gap: 16 },
  solapas: { flexDirection: 'row', gap: 8 },
  solapa: { flex: 1, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
});
