import { router, useLocalSearchParams } from 'expo-router';

import { EntradaDePantalla } from '../../../src/components';
import { MisInvitaciones } from '../../../src/features/tutor-movil';

/**
 * Destino del enlace del correo (Alcance de Plataformas, 5.11).
 *
 * Cuelga de `(tutor)`, así que el guard de rol manda a login si no hay sesión y
 * vuelve acá después de entrar o de registrarse — que es exactamente lo que
 * necesita quien recibe la invitación y todavía no tiene cuenta.
 */
export default function AceptarInvitacion() {
  const { token } = useLocalSearchParams<{ token: string }>();

  return (
    <EntradaDePantalla>
      <MisInvitaciones
        token={token ?? ''}
        onListo={() => router.replace('/(tutor)/mascotas')}
        onCancelar={() => router.replace('/(tutor)/mascotas')}
      />
    </EntradaDePantalla>
  );
}
