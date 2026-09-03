import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
 * La cola vive en memoria y no sobrevive a que el sistema mate el proceso. Es
 * menos de lo que pide el documento —ahí la cola vive en el dispositivo— y está
 * asumido: persistirla exige una tabla en la copia local, que solo existe para el
 * tutor en nativo. Lo que se pierde son los eventos generados sin señal si la app
 * se cierra antes de reconectar.
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
  despachando = correr().finally(() => {
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
}

export function cuantosEventosEsperan(): number {
  return cola.length;
}
