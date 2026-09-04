import { useMutation } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { reenviarConfirmacionDeCorreo } from '../../api/confirmacion';
import { Button, Icon, InlineError } from '../../components';
import { mensajeDeError } from '../../lib/errores';
import { sombra, useTheme } from '../../theme';

/**
 * Aviso de que la dirección de correo está sin confirmar, con el reenvío del
 * enlace (Alcance de Plataformas, 5.8).
 *
 * **No bloquea nada, y el copy lo dice.** Confirmar el correo no es condición de
 * ninguna operación (regla 4.9.1): la cuenta funciona igual. Es el único lugar
 * donde alguien puede arreglar un correo mal tipeado antes de necesitarlo, que
 * es siempre el peor momento — el día que olvide la contraseña, la recuperación
 * va a mandar el enlace a esa dirección.
 *
 * Se dibuja como una nota y no como un error: no hay nada roto.
 */
export function AvisoDeCorreoSinConfirmar({
  email,
  confirmado,
}: {
  email: string;
  confirmado: boolean;
}) {
  const { t, px, texto } = useTheme();
  const reenvio = useMutation({ mutationFn: () => reenviarConfirmacionDeCorreo() });

  // Una vez confirmado el aviso no vuelve a aparecer: no queda nada que ofrecer.
  if (confirmado) return null;

  return (
    <View
      style={[
        estilos.aviso,
        sombra('--shadow-sm'),
        {
          padding: px('--gutter-card'),
          borderRadius: px('--radius-card'),
          backgroundColor: t['--surface-card'],
          borderColor: t['--border-default'],
        },
      ]}
    >
      <View style={estilos.encabezado}>
        <Icon name="mail" size={18} color={t['--text-muted']} />
        <Text style={[texto('h3'), { color: t['--text-strong'] }]}>Confirmá tu correo</Text>
      </View>

      {reenvio.isSuccess ? (
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Listo, salió de nuevo a {email}. Revisá también el correo no deseado.
        </Text>
      ) : (
        <Text style={[texto('body-sm'), { color: t['--text-muted'] }]}>
          Te llegó un enlace a {email} y todavía no lo usaste. Tu cuenta funciona igual: esto es
          para que podamos escribirte si alguna vez olvidás tu contraseña.
        </Text>
      )}

      {reenvio.isError ? (
        <InlineError
          compact
          title="No se pudo reenviar"
          description={mensajeDeError(reenvio.error)}
        />
      ) : null}

      {!reenvio.isSuccess ? (
        <Button
          variant="secondary"
          size="sm"
          loading={reenvio.isPending}
          onPress={() => reenvio.mutate()}
        >
          Reenviar el enlace
        </Button>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: { borderWidth: 1, gap: 10, alignItems: 'flex-start' },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
