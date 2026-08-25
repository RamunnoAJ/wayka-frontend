import { useFonts } from 'expo-font';

import { esWeb } from '../lib/plataforma';

import { FUENTES_NATIVAS } from './tipografia-nativa';

/**
 * Carga Satoshi.
 *
 * En web las fuentes las declara `@font-face` en
 * `design-system/tokens/fonts.css`, que entra por el import de `styles.css`:
 * no hay nada que esperar. En nativo se cargan los estáticos OTF con
 * `expo-font` (doc 09, sección 5).
 *
 * Devuelve `true` cuando se puede pintar sin que el texto salte de tipografía.
 */
export function useFuentes(): boolean {
  const [cargadas, error] = useFonts(esWeb ? {} : FUENTES_NATIVAS);
  // Si una fuente no carga, se pinta igual con la del sistema: quedarse en el
  // splash para siempre es peor que un fallback tipográfico.
  return esWeb || cargadas || Boolean(error);
}
