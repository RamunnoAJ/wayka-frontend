/**
 * Variante web de la cola de telemetría. **No importa `expo-sqlite`**, y esa es
 * toda su razón de ser: el módulo nativo trae para web un worker con un `.wasm`
 * que el bundler no resuelve, y basta con nombrarlo para romper la exportación
 * web entera aunque el código nunca lo llame. Mismo motivo que
 * `base-local.web.ts`.
 *
 * Acá persistir importa menos que en móvil —la web no tiene modo sin conexión, y
 * cerrar la pestaña termina el uso— pero sigue valiendo para lo que se emitió
 * con la red caída o justo antes de recargar.
 */
const CLAVE = 'wayka.cola-de-telemetria';

/**
 * `localStorage` no está durante la exportación estática, que corre en Node sin
 * `window`, y lanza por cuota en Safari privado. En los dos casos la cola sigue
 * en memoria y se despacha igual, que es el mismo criterio que usa
 * `almacenamiento-refresh.ts` para la sesión.
 */
function almacen(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function leerColaGuardada(): Promise<string | null> {
  try {
    return almacen()?.getItem(CLAVE) ?? null;
  } catch {
    return null;
  }
}

export async function guardarCola(serializada: string): Promise<void> {
  try {
    almacen()?.setItem(CLAVE, serializada);
  } catch {
    // Sin lugar para guardarla, la cola sigue en memoria y se despacha igual.
  }
}

export async function borrarColaGuardada(): Promise<void> {
  try {
    almacen()?.removeItem(CLAVE);
  } catch {
    // Nada que hacer: la próxima escritura la pisa.
  }
}
