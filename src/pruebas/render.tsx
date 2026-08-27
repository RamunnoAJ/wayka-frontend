import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as renderRNTL } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '../theme';

/**
 * Render con los proveedores que toda pantalla asume: tema, área segura y
 * TanStack Query.
 *
 * Cada prueba estrena su propio `QueryClient` — uno compartido filtraría la
 * caché de una prueba a la siguiente y las volvería dependientes del orden. Y
 * sin reintentos: en una prueba, reintentar un error esperado solo hace que la
 * aserción llegue tarde.
 *
 * Es `async` porque el `render` de @testing-library/react-native lo es desde su
 * v14: hay que esperarlo o las consultas salen sobre un árbol vacío.
 */
export async function render(elemento: ReactElement) {
  const cliente = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function Envoltorio({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <QueryClientProvider client={cliente}>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  return { ...(await renderRNTL(elemento, { wrapper: Envoltorio })), cliente };
}
