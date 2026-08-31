import type * as SQLite from 'expo-sqlite';

/**
 * Variante web de la base local. **No importa `expo-sqlite`**, y esa es toda su
 * razón de ser: el módulo nativo trae para web un worker con un `.wasm` que el
 * bundler no resuelve, así que basta con nombrarlo para romper la exportación
 * web entera —aunque el código nunca lo llame.
 *
 * La web no tiene copia local por decisión de producto, no por esta limitación:
 * el modo sin conexión es del tutor en móvil (doc 11, sección 1). Acá el
 * contrato del módulo se cumple diciendo que no hay copia; quien lo consume ya
 * cae al camino online.
 */

/** No hay copia local en web: quien consuma esto va contra el servidor. */
export const hayCopiaLocal = false;

export async function abrirBaseLocal(): Promise<SQLite.SQLiteDatabase | null> {
  return null;
}

export async function destruirBaseLocal(): Promise<void> {
  // Sin copia local no hay nada que destruir al cerrar sesión.
}
