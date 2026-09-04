import { Stack } from 'expo-router';

import { GuardDeRol } from '../../src/components/GuardDeRol';
import { TIPO_USUARIO } from '../../src/constants/roles';
import { Shell } from '../../src/features/navegacion';
import { esNativo } from '../../src/lib/plataforma';
import { useSincronizacionAutomatica } from '../../src/features/sincronizacion';

/**
 * Tutor: solo en la app (Alcance de Plataformas, sección 2). Estuvo un tiempo
 * alcanzable en la web y se volvió atrás — su producto es la aplicación, y los
 * avisos, la cámara y la copia local sin conexión dependen del aparato.
 *
 * El rebote de acá es de navegación: la barrera real es el backend, que no emite
 * token para un tutor en canal web.
 */
export default function LayoutTutor() {
  // La copia local se mantiene al día desde acá y no desde cada pantalla: es el
  // único lugar que existe mientras el tutor esté adentro de su sección.
  useSincronizacionAutomatica(true);

  return (
    <GuardDeRol permitidos={[TIPO_USUARIO.TUTOR]} alcanzableEnPlataforma={esNativo}>
      <Shell>
        <Stack screenOptions={{ headerShown: false }} />
      </Shell>
    </GuardDeRol>
  );
}
