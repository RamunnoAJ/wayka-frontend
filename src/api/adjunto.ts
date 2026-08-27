import { http } from '../lib/http';

/**
 * Adjuntos. Todo adjunto pertenece a un Paciente; que además documente un
 * Evento clínico es información adicional (`evento_id`, Modelo de Datos, 4.8).
 *
 * Un adjunto **no se edita**: corregir una carga errónea es retirarla y subir
 * otra. Y cada rol retira solo los que subió (regla 2.4), por eso el listado
 * trae `subido_por_usuario_id`.
 */

export const TIPO_DE_ADJUNTO = {
  FOTO: 'foto',
  PDF: 'pdf',
  ESTUDIO: 'estudio',
} as const;

export type TipoDeAdjunto = (typeof TIPO_DE_ADJUNTO)[keyof typeof TIPO_DE_ADJUNTO];

export interface Adjunto {
  id: string;
  paciente_id: string;
  /** Evento que documenta; null cuando es un adjunto general de la mascota. */
  evento_id?: string | null;
  /** Cuenta que lo subió. Es quien puede retirarlo. */
  subido_por_usuario_id: string;
  tipo: TipoDeAdjunto;
  nombre_archivo: string;
  content_type: string;
  tamano_bytes: number;
  /**
   * URL prefirmada de vida corta, recalculada en cada lectura. No es un
   * identificador estable ni sirve para compartir: no persistirla ni cachearla.
   */
  archivo_url: string;
  created_at: string;
  updated_at: string;
}

export interface FiltrosDeAdjuntos {
  /**
   * Acota a un evento concreto. **No existe el filtro inverso** ("solo los
   * generales"): para separarlos se pide el listado completo y se parte acá con
   * `partirPorPertenencia`.
   */
  evento_id?: string;
  limite?: number;
  desplazamiento?: number;
}

function rutaDePaciente(pacienteId: string): string {
  return `/pacientes/${pacienteId}/adjuntos`;
}

export function listarAdjuntos(
  pacienteId: string,
  filtros: FiltrosDeAdjuntos = {},
): Promise<Adjunto[]> {
  return http.get<Adjunto[]>(rutaDePaciente(pacienteId), { params: { ...filtros } });
}

/** Baja lógica: **no borra el objeto del bucket** (regla 2.4). */
export function retirarAdjunto(adjuntoId: string): Promise<null> {
  return http.delete<null>(`/adjuntos/${adjuntoId}`);
}

/**
 * Separa los generales de los que cuelgan de un evento, y agrupa estos últimos
 * por `evento_id` para que el timeline no dispare un request por evento.
 */
export function partirPorPertenencia(adjuntos: Adjunto[]): {
  generales: Adjunto[];
  porEvento: Map<string, Adjunto[]>;
} {
  const generales: Adjunto[] = [];
  const porEvento = new Map<string, Adjunto[]>();
  for (const adjunto of adjuntos) {
    if (!adjunto.evento_id) {
      generales.push(adjunto);
      continue;
    }
    const yaVistos = porEvento.get(adjunto.evento_id);
    if (yaVistos) yaVistos.push(adjunto);
    else porEvento.set(adjunto.evento_id, [adjunto]);
  }
  return { generales, porEvento };
}
