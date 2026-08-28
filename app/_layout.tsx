import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { configurarPresentacionDeAvisos } from '../src/features/notificaciones';
import { useRestaurarSesion } from '../src/hooks/useRestaurarSesion';
import { useSesion } from '../src/hooks/useSesion';
import { crearQueryClient } from '../src/lib/query-client';
import { TIPO_USUARIO } from '../src/constants/roles';
import { ThemeProvider, useFuentes, type NombreTema } from '../src/theme';

// Tokens y @font-face del design system. En nativo el import es un no-op —
// ahí los valores vienen del espejo en JS (/src/theme) y las fuentes de
// expo-font — pero en web es lo que hace que los componentes heredados de
// /design-system sigan funcionando sin tocarlos.
import '../design-system/styles.css';

// Un aviso que llega con la app abierta tiene que verse igual que uno que llega
// con la app cerrada. Se configura una sola vez, al cargar el módulo.
configurarPresentacionDeAvisos();

SplashScreen.preventAutoHideAsync().catch(() => {
  // En web no hay splash: que falle no es un problema.
});

/**
 * Layout raíz: QueryClient, tema, restauración de sesión y contenedor de
 * navegación.
 */
export default function LayoutRaiz() {
  // useState y no un módulo global: un QueryClient por montaje de la app.
  const [queryClient] = useState(crearQueryClient);
  const fuentesListas = useFuentes();

  useRestaurarSesion();

  useEffect(() => {
    if (fuentesListas) SplashScreen.hideAsync().catch(() => {});
  }, [fuentesListas]);

  if (!fuentesListas) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <TemaSegunRol>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </TemaSegunRol>
    </QueryClientProvider>
  );
}

/**
 * El tema lo decide el rol de la sesión: el tutor ve la variante naranja, la
 * clínica y el veterinario la lila (doc 09, sección 4). Sin sesión —en login y
 * en el alta— va el default: todavía no se sabe quién es.
 */
function TemaSegunRol({ children }: { children: React.ReactNode }) {
  const { sesion } = useSesion();
  const nombre: NombreTema =
    sesion?.usuario.tipo_usuario === TIPO_USUARIO.TUTOR ? 'tutor' : 'default';

  return <ThemeProvider nombre={nombre}>{children}</ThemeProvider>;
}
