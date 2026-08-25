import { Stack } from 'expo-router';

import { GuardDeRol } from '../../src/components/GuardDeRol';
import { TIPO_USUARIO } from '../../src/constants/roles';
import { esWeb } from '../../src/lib/plataforma';

/** Clínica_admin: solo web (Alcance de Plataformas, sección 2). */
export default function LayoutClinicaAdmin() {
  return (
    <GuardDeRol permitidos={[TIPO_USUARIO.CLINICA_ADMIN]} alcanzableEnPlataforma={esWeb}>
      <Stack screenOptions={{ headerShown: false }} />
    </GuardDeRol>
  );
}
