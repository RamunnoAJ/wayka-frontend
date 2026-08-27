import { Stack } from 'expo-router';

import { GuardDeRol } from '../../src/components/GuardDeRol';
import { TIPO_USUARIO } from '../../src/constants/roles';
import { Shell } from '../../src/features/navegacion';

/** Veterinario: web y nativo, con paridad total (Alcance de Plataformas, 2). */
export default function LayoutVeterinario() {
  return (
    <GuardDeRol permitidos={[TIPO_USUARIO.VETERINARIO]}>
      <Shell>
        <Stack screenOptions={{ headerShown: false }} />
      </Shell>
    </GuardDeRol>
  );
}
