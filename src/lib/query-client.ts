import { QueryClient } from '@tanstack/react-query';

import { ErrorApi } from './errores';

/**
 * Configuración base del QueryClient.
 *
 * `staleTime` e invalidaciones por feature quedan para el documento de
 * Estándares de Desarrollo de Frontend (Arq. Frontend, sección 8) — acá solo
 * lo que aplica a todas las queries por igual.
 */
export function crearQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Reintentar un 401/403/404 no cambia el resultado: solo retrasa el error.
        retry: (intentos, error) => {
          if (error instanceof ErrorApi && error.status < 500) return false;
          return intentos < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
