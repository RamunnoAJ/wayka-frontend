import { http } from '../lib/http';

/**
 * Tablero de propuestas: qué le pide la gente al producto.
 *
 * Es global de la plataforma —no cuelga de una clínica— y está partido por
 * audiencia: el tutor ve y vota el tablero de la app, el veterinario el suyo
 * (Modelo de Datos, 4.20). **La audiencia no viaja en ningún pedido**: sale del
 * tipo de usuario del token. Por eso ninguna función de acá la recibe, y una
 * propuesta de la otra audiencia responde 404 y no 403.
 */

export const ESTADO_DE_PROPUESTA = {
  RECIBIDA: 'recibida',
  EN_ANALISIS: 'en_analisis',
  PLANIFICADA: 'planificada',
  HECHA: 'hecha',
  DESCARTADA: 'descartada',
} as const;

export type EstadoDePropuesta = (typeof ESTADO_DE_PROPUESTA)[keyof typeof ESTADO_DE_PROPUESTA];

export const ORDEN_DE_PROPUESTAS = {
  VOTADAS: 'votadas',
  RECIENTES: 'recientes',
} as const;

export type OrdenDePropuestas = (typeof ORDEN_DE_PROPUESTAS)[keyof typeof ORDEN_DE_PROPUESTAS];

export interface Propuesta {
  id: string;
  titulo: string;
  descripcion?: string | null;
  /**
   * Solo lo mueve el administrador de la plataforma, fuera de la API. No hay
   * pantalla de moderación: acá el estado se lee (Reglas de Negocio, 4.25).
   */
  estado: EstadoDePropuesta;
  /** A cuántas personas les sirve. Lo calcula el backend: no es una columna. */
  votos: number;
  /**
   * Si la votó quien está mirando. **Nunca viene quién votó ni quién la
   * escribió**: la lista de votantes no existe como recurso (Modelo de Datos,
   * sección 5).
   */
  ya_vote: boolean;
  created_at: string;
  updated_at: string;
}

export interface FiltrosDePropuestas {
  orden?: OrdenDePropuestas;
  limite?: number;
  desplazamiento?: number;
}

export function listarPropuestas(filtros: FiltrosDePropuestas = {}): Promise<Propuesta[]> {
  return http.get<Propuesta[]>('/propuestas', {
    params: {
      orden: filtros.orden,
      limite: filtros.limite,
      desplazamiento: filtros.desplazamiento,
    },
  });
}

export interface CrearPropuestaEntrada {
  /** Entre 3 y 120 caracteres. Es lo único que se lee en el listado. */
  titulo: string;
  /** Opcional, hasta 1000 caracteres. */
  descripcion?: string;
}

/**
 * Nace en `recibida` y **votada por su autor**, en la misma transacción. A
 * partir de la sexta del mismo día responde 409 con código
 * `limite_diario_alcanzado`.
 *
 * No se edita ni se retira después: una idea que ya juntó votos y cambia de
 * texto convierte esos votos en votos a otra cosa.
 */
export function crearPropuesta(entrada: CrearPropuestaEntrada): Promise<Propuesta> {
  return http.post<Propuesta>('/propuestas', { body: entrada });
}

/**
 * Poner el voto y sacarlo son **dos operaciones distintas e idempotentes**, no
 * una que alterna: sobre red mala, reintentar un toggle invierte lo que el
 * usuario quiso. Alternar es de la pantalla, que sabe si el botón está
 * encendido.
 *
 * Las dos devuelven la propuesta con el conteo actualizado, que es lo que
 * permite repintar la tarjeta sin volver a pedir la lista entera.
 */
export function votarPropuesta(propuestaId: string): Promise<Propuesta> {
  return http.put<Propuesta>(`/propuestas/${propuestaId}/voto`);
}

export function quitarVotoDePropuesta(propuestaId: string): Promise<Propuesta> {
  return http.delete<Propuesta>(`/propuestas/${propuestaId}/voto`);
}
