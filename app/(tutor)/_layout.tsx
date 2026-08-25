import { Stack } from 'expo-router';

import { GuardDeRol } from '../../src/components/GuardDeRol';
import { TIPO_USUARIO } from '../../src/constants/roles';
import { esNativo } from '../../src/lib/plataforma';

/** Tutor: solo build nativo (Alcance de Plataformas, sección 1 y 2). */
export default function LayoutTutor() {
  return (
    <GuardDeRol permitidos={[TIPO_USUARIO.TUTOR]} alcanzableEnPlataforma={esNativo}>
      <Stack screenOptions={{ headerShown: false }} />
    </GuardDeRol>
  );
}
