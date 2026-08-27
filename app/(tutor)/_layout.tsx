import { Stack } from 'expo-router';

import { GuardDeRol } from '../../src/components/GuardDeRol';
import { TIPO_USUARIO } from '../../src/constants/roles';
import { Shell } from '../../src/features/navegacion';
import { esNativo } from '../../src/lib/plataforma';

/** Tutor: solo build nativo (Alcance de Plataformas, sección 1 y 2). */
export default function LayoutTutor() {
  return (
    <GuardDeRol permitidos={[TIPO_USUARIO.TUTOR]} alcanzableEnPlataforma={esNativo}>
      <Shell>
        <Stack screenOptions={{ headerShown: false }} />
      </Shell>
    </GuardDeRol>
  );
}
