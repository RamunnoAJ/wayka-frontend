import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';

function suscribir(callback: () => void): () => void {
  const sub = Dimensions.addEventListener('change', callback);
  return () => sub.remove();
}

/**
 * Ancho de la ventana, para elegir composición.
 *
 * No es `useWindowDimensions` porque la exportación web es estática: el HTML se
 * genera sin ventana, así que el snapshot de servidor es `0` y el primer render
 * del cliente coincide con él. Sin eso, hidratar da un desajuste entre el árbol
 * del servidor y el del cliente.
 */
export function useAnchoDeVentana(): number {
  return useSyncExternalStore(
    suscribir,
    () => Dimensions.get('window').width,
    () => 0,
  );
}
