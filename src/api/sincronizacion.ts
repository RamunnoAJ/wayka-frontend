import type { Adjunto } from './adjunto';
import type { Cita } from './cita';
import type { EventoClinico } from './evento-clinico';
import type { Medicacion } from './medicacion';
import type { Paciente } from './paciente';
import type { Tutor } from './tutor';
import { http } from '../lib/http';

/**
 * Sincronización sin conexión. Tipado a mano contra `openapi/openapi.yaml`
 * (doc 08, sección 7), como el resto de `/src/api`.
 *
 * Es el único recurso del contrato que no representa una entidad: la bajada
 * trae registros de seis entidades a la vez y la subida manda intenciones de
 * escritura, no recursos. Por eso vive en su propio módulo y no cuelga de
 * ninguno de los otros.
 */
const RUTA = '/sincronizacion';

/** Entidades cuya baja lógica las retira de la copia local (doc 11, sección 4). */
export type EntidadConLapida = 'evento_clinico' | 'medicacion' | 'cita' | 'adjunto';

export interface Lapida {
  entidad: EntidadConLapida;
  id: string;
}

/**
 * El adjunto que viaja a la copia local: el metadato, sin `archivo_url`. No es
 * un recorte por ahorrar bytes — esa URL es prefirmada y de vida corta, y en una
 * copia que existe para funcionar sin conexión ya habría vencido para cuando
 * hiciera falta. Los bytes se piden por el endpoint del adjunto cuando hay red.
 */
export type AdjuntoDeSincronizacion = Omit<Adjunto, 'archivo_url'>;

export interface CambiosDeSincronizacion {
  /** Marca a guardar recién cuando se aplicó el tramo entero. */
  hasta: number;
  hay_mas: boolean;
  /**
   * La marca pedida quedó fuera de la retención de la bitácora: no hay forma de
   * saber qué se perdió en el medio. El cliente descarta su copia y vuelve a
   * pedir desde 0. Cuando es true el resto de la respuesta viene vacío.
   */
  requiere_carga_inicial: boolean;
  tutor?: Tutor;
  pacientes?: Paciente[];
  eventos_clinicos?: EventoClinico[];
  medicaciones?: Medicacion[];
  citas?: Cita[];
  adjuntos?: AdjuntoDeSincronizacion[];
  bajas?: Lapida[];
}

/** Superficie de escritura del tutor sin conexión, completa (regla 3.2). */
export type TipoDeMutacion =
  'actualizar_peso_de_paciente' | 'actualizar_ficha_de_tutor' | 'actualizar_cita' | 'retirar_cita';

export interface Mutacion {
  /** Lo genera el cliente: es la clave de la idempotencia del reenvío. */
  id_mutacion: string;
  tipo: TipoDeMutacion;
  entidad_id: string;
  /**
   * `updated_at` que el registro tenía en la copia local. Si el del servidor es
   * otro, alguien lo modificó mientras tanto y la mutación se rechaza por
   * desactualizada (doc 11, sección 6).
   */
  version_base: string;
  /** Informativo: lo declara el cliente y el backend no lo puede verificar. */
  ocurrido_en_cliente?: string;
  paciente?: { peso_actual?: number };
  tutor?: {
    nombre?: string;
    contacto?: string;
    tipo_documento?: string;
    numero_documento?: string;
    direccion?: string;
  };
  cita?: { fecha_programada?: string; notificar_tutor?: boolean };
}

export type ResultadoDeMutacion = 'aceptada' | 'rechazada';

export interface MotivoDeRechazo {
  codigo: string;
  mensaje: string;
  /**
   * Horarios libres más cercanos al pedido. Solo aparecen cuando el motivo lo
   * admite: una cita que ya no está pendiente no se reagenda a ninguna hora.
   */
  alternativas?: string[];
}

export interface ResultadoDeSincronizacion {
  id_mutacion: string;
  resultado: ResultadoDeMutacion;
  /** La versión con la que quedó el registro, si la mutación se aceptó. */
  version?: string;
  motivo?: MotivoDeRechazo;
}

export interface ResultadosDeSincronizacion {
  resultados: ResultadoDeSincronizacion[];
}

/** Tope del lote que acepta el backend. Una cola más larga va en varios envíos. */
export const MUTACIONES_POR_LOTE = 50;

export function bajarCambios(desde: number, limite?: number): Promise<CambiosDeSincronizacion> {
  return http.get<CambiosDeSincronizacion>(RUTA, { params: { desde, limite } });
}

/**
 * Un lote parcialmente rechazado responde 200 igual: el rechazo viaja por
 * mutación, no por pedido. Solo un 4xx del lote entero es un error de red acá.
 */
export function subirMutaciones(mutaciones: Mutacion[]): Promise<ResultadosDeSincronizacion> {
  return http.post<ResultadosDeSincronizacion>(RUTA, { body: { mutaciones } });
}
