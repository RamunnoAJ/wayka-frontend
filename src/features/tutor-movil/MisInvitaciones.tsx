import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, InlineError, SkeletonText } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { useTheme } from '../../theme';
import { EtiquetaDeNivel } from '../accesos/EtiquetaDeNivel';
import { useAceptarInvitacion, useVistaPreviaDeInvitacion } from '../accesos/queries';

/**
 * Aceptar una invitación (Alcance de Plataformas, 5.11).
 *
 * Antes de aceptar muestra **qué mascota es, quién invita y con qué nivel**, y
 * nada del historial: aceptar es justamente lo que da acceso a él.
 *
 * Un enlace inválido, vencido o ya usado dan todos el mismo mensaje. No es
 * pereza: distinguirlos le diría a quien prueba enlaces al azar cuál acertó a
 * medias.
 */
export function MisInvitaciones({
  token,
  onListo,
  onCancelar,
}: {
  token: string;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const { t, px, texto } = useTheme();
  const vista = useVistaPreviaDeInvitacion(token);
  const aceptar = useAceptarInvitacion();

  return (
    <View style={[estilos.raiz, { backgroundColor: t['--surface-page'] }]}>
      <ScrollView>
        <View style={[estilos.contenido, { paddingHorizontal: px('--gutter-mobile') }]}>
          {vista.isPending ? (
            <SkeletonText lines={4} />
          ) : vista.isError ? (
            <InlineError
              title="Este enlace no sirve"
              description="Puede haber vencido, ya haberse usado, o no ser el correcto. Pedile a quien te lo mandó que te invite de nuevo."
            />
          ) : (
            <>
              <Text style={[texto('h1'), { color: t['--text-strong'] }]}>
                {`${vista.data?.invitado_por} te compartió a ${vista.data?.nombre_del_paciente}`}
              </Text>

              <View style={estilos.nivel}>
                <Text style={[texto('body'), { color: t['--text-muted'] }]}>Vas a poder:</Text>
                {vista.data ? <EtiquetaDeNivel nivel={vista.data.nivel} /> : null}
              </View>

              <Text style={[texto('body-sm'), { color: t['--text-subtle'] }]}>
                Al aceptar vas a ver su ficha, su historial clínico y sus turnos.
              </Text>

              {aceptar.error ? (
                <InlineError
                  compact
                  title="No se pudo aceptar"
                  description={mensajeDeError(aceptar.error)}
                />
              ) : null}

              <View style={estilos.acciones}>
                <Button
                  block
                  loading={aceptar.isPending}
                  onPress={() => aceptar.mutate(token, { onSuccess: onListo })}
                >
                  Aceptar
                </Button>
                <Button block variant="ghost" onPress={onCancelar}>
                  Ahora no
                </Button>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { paddingVertical: 24, gap: 16 },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  acciones: { gap: 8, marginTop: 8 },
});
