import Store from 'expo-sqlite/kv-store';

/**
 * Dónde vive la cola de telemetría entre arranques de la app.
 *
 * La cola era de memoria y no sobrevivía a que el sistema matara el proceso.
 * Justo el caso que Telemetría de Producto, 7 existe para cubrir: el tutor pasa
 * el día sin señal, acumula, y la app se cierra antes de reconectar. Lo que se
 * perdía no era ruido, era `sesion_servida_offline` — la métrica que decide si
 * el modo sin conexión resuelve algo o solo agrega complejidad — sesgada hacia
 * cero justo en los usos que más la necesitaban.
 *
 * **Va sin cifrar, y a propósito.** No es la copia local (`base-local.ts`), que
 * lleva historial clínico y va sobre SQLCipher: acá ningún evento lleva dato
 * clínico ni texto libre ni el id de una mascota, porque la lista permitida se
 * aplica del otro lado y las claves fuera de ella se descartan (regla 2.7).
 * Cifrar esto sería proteger una lista de nombres de pantalla.
 *
 * Es `expo-sqlite/kv-store` y no la copia local porque la cola es de las tres
 * plataformas y de los tres roles, mientras que la copia local es del tutor en
 * nativo. Colgar la telemetría del veterinario de una base que solo existe para
 * el tutor la dejaría sin persistir en la mitad de los casos.
 */
const CLAVE = 'wayka.cola-de-telemetria';

/**
 * Ninguna de estas funciones propaga un error, y es la misma regla que gobierna
 * todo el módulo: **la telemetría nunca estorba**. Un almacenamiento lleno o un
 * JSON que quedó a medias es un dato menos, no un arranque que falla.
 */
export async function leerColaGuardada(): Promise<string | null> {
  try {
    return await Store.getItem(CLAVE);
  } catch {
    return null;
  }
}

export async function guardarCola(serializada: string): Promise<void> {
  try {
    await Store.setItem(CLAVE, serializada);
  } catch {
    // Sin lugar para guardarla, la cola sigue en memoria y se despacha igual.
  }
}

export async function borrarColaGuardada(): Promise<void> {
  try {
    await Store.removeItem(CLAVE);
  } catch {
    // Nada que hacer: la próxima escritura la pisa.
  }
}
