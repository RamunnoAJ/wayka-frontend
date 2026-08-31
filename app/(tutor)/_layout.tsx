import { Stack } from 'expo-router';

import { GuardDeRol } from '../../src/components/GuardDeRol';
import { TIPO_USUARIO } from '../../src/constants/roles';
import { Shell } from '../../src/features/navegacion';
import { useSincronizacionAutomatica } from '../../src/features/sincronizacion';

/**
 * Tutor: alcanzable en las dos plataformas (Alcance de Plataformas, sección 2).
 *
 * Entró a la web después de la primera versión del alcance. Lo que no viaja con
 * él son el push y la cámara, que dependen del aparato y degradan solas — no hay
 * pantalla que sacar ni permiso que cambiar.
 */
export default function LayoutTutor() {
  // La copia local se mantiene al día desde acá y no desde cada pantalla: es el
  // único lugar que existe mientras el tutor esté adentro de su sección.
  useSincronizacionAutomatica(true);

  return (
    <GuardDeRol permitidos={[TIPO_USUARIO.TUTOR]}>
      <Shell>
        <Stack screenOptions={{ headerShown: false }} />
      </Shell>
    </GuardDeRol>
  );
}
