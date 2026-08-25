import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Documento HTML de la exportación web. Solo se usa en web: no forma parte de
 * los builds nativos.
 */
export default function Html({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Satoshi. El @font-face vive en un archivo generado desde
            design-system/tokens/fonts.css porque las rutas relativas del CSS
            entregado no sobreviven al pipeline de Metro — ver
            src/theme/generar-tokens.ts. */}
        <link rel="stylesheet" href="/fonts/satoshi.generated.css" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
