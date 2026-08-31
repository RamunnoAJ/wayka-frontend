import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import { esNativo } from './plataforma';

/**
 * Base local del tutor: la copia de sus datos que hace que la app sirva sin
 * conexión (doc 11).
 *
 * **Va cifrada en reposo.** Una copia del historial clínico de una mascota es un
 * dato personal de salud fuera del servidor, y un teléfono perdido no puede
 * entregarlo por copiar un archivo (Ley 25.326; doc 11, sección 8). El cifrado
 * lo da SQLCipher, que `expo-sqlite` trae compilado cuando el plugin se
 * configura con `useSQLCipher` — ver `app.json`.
 *
 * Solo existe en los builds nativos. En web no hay SQLCipher y el tutor tampoco
 * usa la web para esto: `abrirBaseLocal` devuelve null y quien la consume cae al
 * camino online, que es el que la web ya tenía.
 */
const ARCHIVO = 'wayka-copia-local.db';
const CLAVE_EN_LLAVERO = 'wayka.copia-local.clave';

let base: SQLite.SQLiteDatabase | null = null;
let abriendo: Promise<SQLite.SQLiteDatabase | null> | null = null;

/**
 * La clave nace en el dispositivo y vive en el llavero del sistema
 * (Keychain/Keystore), nunca en la base que protege ni en el servidor. Si el
 * llavero la pierde, la copia local es ilegible y se rehace con una carga
 * inicial: es un caché, no la fuente de verdad de nada.
 */
async function claveDeCifrado(): Promise<string> {
  const guardada = await SecureStore.getItemAsync(CLAVE_EN_LLAVERO);
  if (guardada) return guardada;

  const bytes = Crypto.getRandomBytes(32);
  const nueva = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  await SecureStore.setItemAsync(CLAVE_EN_LLAVERO, nueva);
  return nueva;
}

/**
 * Comprueba que el cifrado esté realmente puesto, y no es paranoia: **SQLite
 * ignora en silencio los pragmas que no conoce**. En un binario sin SQLCipher
 * —Expo Go, o un build donde el plugin quedó sin configurar— `PRAGMA key` no
 * falla, no avisa, y la base queda en texto plano con el historial clínico
 * adentro. Todo parecería funcionar.
 *
 * `cipher_version` devuelve una fila solo cuando SQLCipher está compilado, así
 * que es la única respuesta que distingue los dos casos. Sin ella preferimos
 * quedarnos sin copia local: la app pierde el modo sin conexión, que es una
 * degradación visible, en vez de guardar datos de salud sin proteger, que no lo
 * es (doc 11, sección 8).
 */
async function tieneCifrado(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    const fila = await db.getFirstAsync<{ cipher_version?: string }>('PRAGMA cipher_version;');
    return Boolean(fila?.cipher_version);
  } catch {
    return false;
  }
}

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS registro (
  entidad TEXT NOT NULL,
  id TEXT NOT NULL,
  paciente_id TEXT,
  actualizado_en TEXT NOT NULL,
  datos TEXT NOT NULL,
  PRIMARY KEY (entidad, id)
);

CREATE INDEX IF NOT EXISTS registro_por_paciente ON registro (entidad, paciente_id);

CREATE TABLE IF NOT EXISTS marca (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mutacion (
  id TEXT PRIMARY KEY,
  orden INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id TEXT NOT NULL,
  version_base TEXT NOT NULL,
  ocurrido_en_cliente TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  estado TEXT NOT NULL,
  motivo_codigo TEXT,
  motivo_mensaje TEXT,
  alternativas TEXT
);

CREATE INDEX IF NOT EXISTS mutacion_por_estado ON mutacion (estado, orden);
`;

export async function abrirBaseLocal(): Promise<SQLite.SQLiteDatabase | null> {
  if (!esNativo) return null;
  if (base) return base;
  if (abriendo) return abriendo;

  abriendo = (async () => {
    const clave = await claveDeCifrado();
    const abierta = await SQLite.openDatabaseAsync(ARCHIVO);
    // El PRAGMA key va antes que cualquier otra sentencia: sobre una base ya
    // leída no hay forma de aplicarlo.
    await abierta.execAsync(`PRAGMA key = "x'${clave}'";`);

    if (!(await tieneCifrado(abierta))) {
      await abierta.closeAsync();
      // Falla fuerte y no en silencio. Esto no es un estado que una persona
      // usando la app pueda alcanzar: es un binario mal armado —el plugin sin
      // configurar, o Expo Go, que no trae SQLCipher—. Degradar sin avisar
      // dejaría el modo sin conexión apagado sin que nadie se entere hasta que
      // alguien pregunte por qué la app no abre sin señal.
      throw new Error(
        'la copia local no quedó cifrada: este build no tiene SQLCipher. ' +
          'Revisá el plugin expo-sqlite en app.json y corré expo prebuild; en Expo Go no funciona.',
      );
    }

    await abierta.execAsync(ESQUEMA);
    base = abierta;
    return abierta;
  })();

  try {
    return await abriendo;
  } finally {
    abriendo = null;
  }
}

/**
 * Destruye la copia local. Se llama al cerrar sesión y cuando el backend
 * rechaza el token de refresco: el estado que sobrevive a un cierre de sesión es
 * estado que alguien más puede leer (doc 11, sección 8).
 *
 * La clave se borra junto con los datos. Dejarla en el llavero no filtra nada
 * por sí sola, pero una clave sin base que proteger es una credencial viva sin
 * dueño, y la siguiente sesión genera la suya.
 */
export async function destruirBaseLocal(): Promise<void> {
  if (!esNativo) return;

  if (base) {
    await base.closeAsync();
    base = null;
  }
  await SQLite.deleteDatabaseAsync(ARCHIVO).catch(() => {
    // Que no exista es el estado deseado: no hay nada que reportar.
  });
  await SecureStore.deleteItemAsync(CLAVE_EN_LLAVERO).catch(() => {});
}

/** true cuando esta plataforma puede sostener una copia local. */
export const hayCopiaLocal = esNativo;
