import { ConfirmacionDeCorreo } from '../../src/features/auth';
import { EntradaDePantalla } from '../../src/components';
import { esWeb } from '../../src/lib/plataforma';
import { ThemeProvider } from '../../src/theme';

/**
 * Ruta de la confirmación del correo. Solo monta los proveedores: la pantalla
 * vive en `src/features/auth` porque en `app/` todo archivo es una ruta —
 * incluido un `.test.tsx`, que el bundler intentaría servir.
 *
 * Mismo criterio que el login: en nativo arranca en tema tutor, que es el rol
 * mayoritario de esa plataforma.
 */
export default function ConfirmarCorreo() {
  return (
    <ThemeProvider nombre={esWeb ? 'default' : 'tutor'}>
      <EntradaDePantalla>
        <ConfirmacionDeCorreo />
      </EntradaDePantalla>
    </ThemeProvider>
  );
}
