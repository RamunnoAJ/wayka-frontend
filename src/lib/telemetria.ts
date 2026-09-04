import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

import { borrarColaGuardada, guardarCola, leerColaGuardada } from './almacenamiento-cola';
import {
  EVENTOS_POR_LOTE,
  registrarTelemetria,
  type EventoDeTelemetria,
  type EventoDeUso,
  type PropiedadesDeUso,
} from '../api/telemetria';
import { obtenerTokenAcceso } from '../stores/sesion';

/**
 * Cola de telemetría del cliente.
 *
 * Tres reglas la definen, y las tres salen de que **la telemetría nunca bloquea
 * al usuario** (Telemetría de Producto, 7):
 *
 * 1. **Se acumula y se despacha por lote.** Un pedido por pantalla vista es un
 *    costo de red desproporcionado para el valor del dato.
 * 2. **La cola tiene techo y descarta lo más viejo.** Una mutación no se descarta
 *    nunca; un evento sí, y esa es la diferencia entre las dos colas.
 * 3. **Un fallo no se reintenta para siempre ni demora nada.** Si el despacho
 *    falla, el lote vuelve a la cola y se prueba en la próxima ocasión; al llegar
 *    al techo de intentos se descarta.
 *
 * **Sin sesión no se emite.** La ruta exige token, y encolar lo que va a ser
 * rechazado solo llena la cola con lo que nunca va a entrar.
 *
 * **La cola vive en el dispositivo y sobrevive a que el sistema mate el
 * proceso** (`almacenamiento-cola.ts`). Estuvo un tiempo solo en memoria, y lo
 * que se perdía era justo lo que el documento quiere medir: los eventos que el
 * tutor genera sin señal, cuando la app se cierra antes de reconectar. Eso
 * sesgaba `sesion_servida_offline` hacia cero en los usos que más la
 * necesitaban, que es la peor forma de equivocarse — no agrega ruido, corre la
 * media para el lado que hace parecer que el offline no sirve.
 *
 * Se vuelca en los mismos momentos en que se despacha y no en cada `emitir`:
 * quinientas escrituras a disco por sesión, para un dato que nunca bloquea al
 * usuario, sería al revés del principio.
 */
const TECHO_DE_LA_COLA = 500;
const INTENTOS_MAXIMOS = 3;

/** El lote se despacha solo al llegar a esto; el resto lo dispara el ciclo. */
const LOTE_QUE_DISPARA = 20;

interface EventoEnCola extends EventoDeTelemetria {
  intentos: number;
}

let cola: EventoEnCola[] = [];
let despachando: Promise<void> | null = null;
/**
 * Con el último despacho fallido, emitir deja de intentar y solo acumula. Es la
 * misma regla que la sincronización: una corrida que falló por falta de red la
 * vuelve a disparar el evento de conexión, y un reintento por cada veinte
 * eventos solo gastaría viajes contra una conexión que ya demostró ser mala.
 */
let ultimoDespachoFallo = false;

/**
 * Identifica un uso de la app y no a una persona: nace al arrancar y se descarta
 * al cerrar. No es el token ni deriva de él.
 */
let sesionDeUso = nuevaSesionDeUso();

function nuevaSesionDeUso(): string {
  // **Tiene que ser un UUID de verdad**: el contrato declara `sesion_id` con
  // formato uuid y el backend lo decodifica como tal, así que un identificador
  // con otra forma hace fallar el lote entero con un 400 — y la telemetría, que
  // nunca debe estorbar, se perdía completa sin que nadie se enterara.
  //
  // Se arma a mano porque `crypto.randomUUID` no está en todos los runtimes de
  // React Native. No es criptográfico y no hace falta que lo sea: identifica un
  // uso de la app dentro de la ventana de retención, no a una persona.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (marca) => {
    const azar = Math.floor(Math.random() * 16);
    const digito = marca === 'x' ? azar : (azar % 4) + 8;
    return digito.toString(16);
  });
}

/** Se llama al cerrar sesión: el uso siguiente es otro, aunque el aparato sea el mismo. */
export function renovarSesionDeUso(): void {
  sesionDeUso = nuevaSesionDeUso();
}

function plataforma(): 'web' | 'ios' | 'android' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

function versionDeLaApp(): string | undefined {
  return Constants.expoConfig?.version ?? undefined;
}

/**
 * Qué paquete corre este cliente. La versión declarada en la app **no cambia**
 * al publicar una actualización por aire, así que dos clientes con la misma
 * `app_version` pueden estar corriendo código distinto: sin esto, atribuir un
 * salto de una serie a una entrega —la única razón por la que se guarda la
 * versión— no se puede.
 *
 * Queda `undefined` donde no hay actualización por aire: el navegador, el
 * entorno de desarrollo y Expo Go. No es dato personal: lo genera el sistema de
 * compilación, no el aparato.
 */
function entregaEnCurso(): string | undefined {
  return Updates.updateId ?? undefined;
}

/**
 * Recupera lo que quedó del uso anterior. Se llama una vez al arrancar, antes de
 * que nada emita.
 *
 * Los eventos recuperados **conservan su `sesion_id` original**: son de otro uso
 * de la app, y renumerarlos con el actual mezclaría dos sesiones en una y
 * rompería el conteo. El identificador nuevo es solo para lo que se emita ahora.
 */
export async function hidratarColaDeTelemetria(): Promise<void> {
  const guardada = await leerColaGuardada();
  if (!guardada) return;

  try {
    const recuperados = JSON.parse(guardada) as EventoEnCola[];
    if (!Array.isArray(recuperados)) return;
    cola = [...recuperados, ...cola].slice(-TECHO_DE_LA_COLA);
  } catch {
    // Un JSON cortado a la mitad —la app murió mientras escribia— es un dato
    // menos y no un arranque que falla.
    await borrarColaGuardada();
  }
}

/** Vuelca lo pendiente. La cola vacia borra en vez de guardar un `[]`. */
async function volcarCola(): Promise<void> {
  if (cola.length === 0) {
    await borrarColaGuardada();
    return;
  }
  await guardarCola(JSON.stringify(cola));
}

/**
 * Encola un hecho de uso. No devuelve nada y no falla nunca: quien lo llama está
 * haciendo otra cosa, y enterarse de que la métrica no se pudo guardar no le
 * sirve para nada.
 */
export function emitir(nombre: EventoDeUso, propiedades?: PropiedadesDeUso): void {
  if (!obtenerTokenAcceso()) return;

  cola.push({
    nombre,
    ocurrido_at: new Date().toISOString(),
    sesion_id: sesionDeUso,
    app_version: versionDeLaApp(),
    update_id: entregaEnCurso(),
    ...(propiedades ? { propiedades } : {}),
    intentos: 0,
  });

  // Descarta lo más viejo, no lo más nuevo: una cola llena de eventos de hace
  // una semana tapa lo que está pasando ahora.
  if (cola.length > TECHO_DE_LA_COLA) {
    cola = cola.slice(cola.length - TECHO_DE_LA_COLA);
  }

  if (!ultimoDespachoFallo && cola.length >= LOTE_QUE_DISPARA) void despachar();
}

/**
 * Sube lo acumulado. Se la invoca al volver la conexión, al pasar la app al
 * fondo y después de sincronizar — nunca antes de subir las mutaciones, que van
 * primero.
 *
 * Una sola corrida a la vez: dos en paralelo mandarían los mismos eventos dos
 * veces, y el backend no los deduplica —no tienen por qué ser únicos—.
 */
export function despachar(): Promise<void> {
  if (despachando) return despachando;
  // El volcado va despues de correr y no antes: lo que se despacho con exito ya
  // no esta en la cola, y guardarlo primero dejaria en disco eventos que se
  // volverian a mandar en el proximo arranque.
  despachando = correr()
    .then(volcarCola)
    .finally(() => {
      despachando = null;
    });
  return despachando;
}

async function correr(): Promise<void> {
  while (cola.length > 0 && obtenerTokenAcceso()) {
    const lote = cola.slice(0, EVENTOS_POR_LOTE);
    cola = cola.slice(lote.length);

    try {
      await registrarTelemetria({
        plataforma: plataforma(),
        eventos: lote.map(({ intentos: _intentos, ...evento }) => evento),
      });
      ultimoDespachoFallo = false;
    } catch {
      // Vuelven al frente de la cola con un intento más: los descartados son los
      // que ya agotaron el techo, y perderlos es un dato menos.
      const reintentables = lote
        .map((evento) => ({ ...evento, intentos: evento.intentos + 1 }))
        .filter((evento) => evento.intentos < INTENTOS_MAXIMOS);
      cola = [...reintentables, ...cola].slice(-TECHO_DE_LA_COLA);
      ultimoDespachoFallo = true;
      return;
    }
  }
}

/** Solo para los tests: la cola es un singleton de módulo. */
export function vaciarColaDeTelemetria(): void {
  cola = [];
  ultimoDespachoFallo = false;
  void borrarColaGuardada();
}

export function cuantosEventosEsperan(): number {
  return cola.length;
}
