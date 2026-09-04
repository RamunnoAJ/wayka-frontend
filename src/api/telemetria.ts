import { http } from '../lib/http';

/**
 * Registro de uso del producto (Telemetría de Producto).
 *
 * Solo viaja por acá **lo que el backend no puede ver por sí mismo**: qué
 * pantalla se abrió, cuánto tardó un formulario, si se abandonó, si la sesión
 * salió de la copia local, si el usuario llegó desde un push. Todo hecho que el
 * servidor ya ve lo emite el servidor, y mandarlo también desde acá daría dos
 * cifras del mismo hecho.
 *
 * Ni el usuario, ni el rol, ni la clínica se envían: los resuelve el backend con
 * el token. Ningún evento lleva dato clínico ni texto libre — lo que no está en
 * la lista permitida de su evento se descarta del otro lado.
 */

export const EVENTO_DE_USO = {
  PANTALLA_VISTA: 'pantalla_vista',
  CARGA_EVENTO_ABIERTA: 'carga_evento_abierta',
  CARGA_EVENTO_ABANDONADA: 'carga_evento_abandonada',
  /**
   * El otro extremo del cronómetro. Sin él, la única `duracion_ms` registrada es
   * la de los que se fueron a la mitad, y el "Tiempo de carga" de Telemetría de
   * Producto, 9 termina siendo la mediana del abandono con otro nombre.
   */
  CARGA_EVENTO_GUARDADA: 'carga_evento_guardada',
  APP_ABIERTA_DESDE_PUSH: 'app_abierta_desde_push',
  NOTIFICACIONES_DESACTIVADAS: 'notificaciones_desactivadas',
  SESION_SERVIDA_OFFLINE: 'sesion_servida_offline',
  /**
   * El embudo del paso de antecedentes (Reglas de Negocio, 4.23). Es lo único de
   * esa pantalla que se mide por acá: cuántas fichas nacen con historia se
   * cuenta por SQL sobre el historial, que es el dato real y no una muestra.
   * Esto es lo que ninguna tabla sabe — cuántos tutores **vieron** el paso y
   * siguieron de largo.
   */
  PASO_DE_ANTECEDENTES_RESUELTO: 'paso_de_antecedentes_resuelto',
} as const;

export type EventoDeUso = (typeof EVENTO_DE_USO)[keyof typeof EVENTO_DE_USO];

/** Valores de métrica: enums, números y booleanos. Nunca texto escrito por alguien. */
export type PropiedadesDeUso = Record<string, string | number | boolean>;

export interface EventoDeTelemetria {
  nombre: EventoDeUso;
  /** ISO 8601. El reloj del cliente: el servidor guarda además cuándo lo recibió. */
  ocurrido_at: string;
  /** Agrupa los eventos de un mismo uso de la app. No es el token ni deriva de él. */
  sesion_id?: string;
  app_version?: string;
  /**
   * Qué paquete corre el cliente. `app_version` sola no lo dice: no cambia al
   * publicar una actualización por aire, así que dos clientes con la misma
   * versión pueden estar corriendo código distinto. Queda `undefined` en el
   * navegador y en desarrollo, donde no hay actualización por aire.
   */
  update_id?: string;
  propiedades?: PropiedadesDeUso;
}

export interface RegistrarTelemetriaEntrada {
  plataforma: 'web' | 'ios' | 'android';
  eventos: EventoDeTelemetria[];
}

/**
 * Cuántos entraron y cuántos se descartaron. No dice cuáles ni por qué: no hay
 * nada que el cliente pueda hacer con esa información, y el detalle queda en el
 * log del backend.
 */
export interface ResultadoDeTelemetria {
  recibidos: number;
  descartados: number;
}

/** Tope del lote, igual que el del backend. Una cola más larga va en varios. */
export const EVENTOS_POR_LOTE = 200;

export function registrarTelemetria(
  entrada: RegistrarTelemetriaEntrada,
): Promise<ResultadoDeTelemetria> {
  return http.post<ResultadoDeTelemetria>('/telemetria', { body: entrada });
}
