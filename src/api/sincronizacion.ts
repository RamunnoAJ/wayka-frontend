import type { Adjunto } from './adjunto';
import type { Cita } from './cita';
import type { CrearEventoEntrada, EventoClinico } from './evento-clinico';
import type { CrearMedicacionEntrada, Medicacion } from './medicacion';
import type { DatosNoClinicosDeLaMascota, Paciente } from './paciente';
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
  | 'actualizar_peso_de_paciente'
  | 'actualizar_datos_de_paciente'
  | 'actualizar_ficha_de_tutor'
  | 'actualizar_cita'
  | 'retirar_cita'
  | 'cargar_antecedente_clinico'
  | 'cargar_antecedente_de_medicacion';

/**
 * Las dos mutaciones que **crean** en vez de editar (Reglas de Negocio, 4.23).
 * Se nombran aparte porque cambian dos cosas del resto de la cola: no llevan
 * `version_base` y su `entidad_id` es la mascota.
 */
export const MUTACIONES_DE_ALTA: TipoDeMutacion[] = [
  'cargar_antecedente_clinico',
  'cargar_antecedente_de_medicacion',
];

export interface Mutacion {
  /** Lo genera el cliente: es la clave de la idempotencia del reenvío. */
  id_mutacion: string;
  tipo: TipoDeMutacion;
  /**
   * Registro sobre el que se escribe. **En las dos mutaciones de alta es la
   * mascota** y no el registro que se va a crear, que todavía no existe.
   */
  entidad_id: string;
  /**
   * `updated_at` que el registro tenía en la copia local. Si el del servidor es
   * otro, alguien lo modificó mientras tanto y la mutación se rechaza por
   * desactualizada (doc 11, sección 6).
   *
   * Ausente en las dos altas —no hay registro previo cuyo `updated_at`
   * comparar— y en el retiro de una cita, que no la usa por otro motivo: una
   * cita que cambió mientras tanto sigue siendo una a la que el tutor no va a
   * llevar a su mascota.
   */
  version_base?: string;
  /** Informativo: lo declara el cliente y el backend no lo puede verificar. */
  ocurrido_en_cliente?: string;
  /**
   * Payload de las dos mutaciones de la mascota. La del peso aplica **solo** el
   * peso —el backend descarta el resto, a propósito— y la de datos aplica solo
   * los no clínicos: el tipo es lo que decide qué se toma.
   */
  paciente?: { peso_actual?: number } & DatosNoClinicosDeLaMascota;
  tutor?: {
    nombre?: string;
    contacto?: string;
    tipo_documento?: string;
    numero_documento?: string;
    direccion?: string;
    direccion_place_id?: string;
    direccion_lat?: number;
    direccion_lng?: number;
  };
  cita?: { fecha_programada?: string; notificar_tutor?: boolean };
  /** Payload del alta de un antecedente. El paciente sale del `entidad_id`. */
  evento_clinico?: CrearEventoEntrada;
  medicacion?: CrearMedicacionEntrada;
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
