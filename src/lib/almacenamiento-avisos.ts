import * as SecureStore from 'expo-secure-store';

import { esNativo } from './plataforma';

/**
 * Lo que este teléfono recuerda sobre sus avisos push, entre arranques de la app.
 *
 * Son dos cosas distintas y por eso son dos claves:
 *
 * 1. **Si el tutor los quiere.** Es una decisión suya, no un estado del sistema
 *    operativo: apagarlos tiene que seguir apagado después de cerrar y volver a
 *    abrir sesión, o el registro automático del login los volvería a prender y
 *    el interruptor no serviría de nada.
 * 2. **Qué `Dispositivo` es este en el backend.** El id lo devuelve el alta y no
 *    hay forma de volver a pedirlo: el contrato no expone un listado, y el token
 *    de push tampoco vuelve en ninguna respuesta (es una credencial de entrega).
 *    Sin guardarlo, apagar los avisos después de reiniciar la app no tendría a
 *    quién dar de baja.
 *
 * **Solo en nativo.** En web no hay push (Alcance de Plataformas, 5.5), así que
 * no hay preferencia que guardar y todo responde el valor por defecto.
 */
const CLAVE_DE_LA_PREFERENCIA = 'wayka.avisos-activados';
const CLAVE_DEL_DISPOSITIVO = 'wayka.dispositivo-registrado';

/**
 * Sin nada guardado, los avisos están prendidos.
 *
 * No es el default cómodo: es que el permiso del sistema operativo ya es una
 * decisión explícita del tutor, y volver a pedirle que los prenda acá adentro
 * sería pedirle dos veces lo mismo.
 */
const POR_DEFECTO = true;

export async function leerPreferenciaDeAvisos(): Promise<boolean> {
  if (!esNativo) return POR_DEFECTO;
  try {
    const guardado = await SecureStore.getItemAsync(CLAVE_DE_LA_PREFERENCIA);
    if (guardado === null) return POR_DEFECTO;
    return guardado === 'si';
  } catch {
    return POR_DEFECTO;
  }
}

export async function guardarPreferenciaDeAvisos(activados: boolean): Promise<void> {
  if (!esNativo) return;
  try {
    await SecureStore.setItemAsync(CLAVE_DE_LA_PREFERENCIA, activados ? 'si' : 'no');
  } catch {
    // Queda con el valor de esta sesión. Peor sería no aplicar el cambio.
  }
}

export async function leerDispositivoRegistrado(): Promise<string | null> {
  if (!esNativo) return null;
  try {
    return await SecureStore.getItemAsync(CLAVE_DEL_DISPOSITIVO);
  } catch {
    return null;
  }
}

export async function guardarDispositivoRegistrado(id: string | null): Promise<void> {
  if (!esNativo) return;
  try {
    if (id === null) await SecureStore.deleteItemAsync(CLAVE_DEL_DISPOSITIVO);
    else await SecureStore.setItemAsync(CLAVE_DEL_DISPOSITIVO, id);
  } catch {
    // Sin el id no se puede dar de baja este aparato desde acá; el backend
    // reasigna el token igual cuando otra cuenta lo registra.
  }
}
