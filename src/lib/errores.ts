/**
 * Códigos de error del backend. Son estables y son por lo que hay que
 * preguntar: el `mensaje` que los acompaña es texto para mostrar, no un
 * discriminante (`Error` en `openapi/openapi.yaml`).
 */
export const CODIGO_ERROR = {
  DATOS_INVALIDOS: 'datos_invalidos',
  CREDENCIALES_INVALIDAS: 'credenciales_invalidas',
  PERMISO_DENEGADO: 'permiso_denegado',
  NO_ENCONTRADO: 'no_encontrado',
  CONFLICTO: 'conflicto',
  ARCHIVO_DEMASIADO_GRANDE: 'archivo_demasiado_grande',
  ERROR_INTERNO: 'error_interno',
} as const;

export type CodigoError = (typeof CODIGO_ERROR)[keyof typeof CODIGO_ERROR];

/** Cuerpo de error del contrato: siempre `{codigo, mensaje}`. */
interface CuerpoError {
  codigo: string;
  mensaje: string;
}

function esCuerpoDeError(cuerpo: unknown): cuerpo is CuerpoError {
  return (
    typeof cuerpo === 'object' &&
    cuerpo !== null &&
    typeof (cuerpo as CuerpoError).codigo === 'string' &&
    typeof (cuerpo as CuerpoError).mensaje === 'string'
  );
}

/** Error de una respuesta HTTP no exitosa. */
export class ErrorApi extends Error {
  readonly status: number;
  /**
   * Código estable del contrato, o `undefined` si la respuesta no tenía la
   * forma esperada (un proxy, un 502 de infraestructura).
   */
  readonly codigo?: CodigoError | string;
  readonly cuerpo: unknown;

  constructor(status: number, cuerpo: unknown) {
    const conForma = esCuerpoDeError(cuerpo);
    super(conForma ? cuerpo.mensaje : `La solicitud falló (HTTP ${status}).`);
    this.name = 'ErrorApi';
    this.status = status;
    this.codigo = conForma ? cuerpo.codigo : undefined;
    this.cuerpo = cuerpo;
  }

  esCodigo(codigo: CodigoError): boolean {
    return this.codigo === codigo;
  }

  /** Token de acceso ausente, vencido o inválido: dispara el refresh. */
  get esNoAutenticado(): boolean {
    return this.status === 401;
  }
}

/** Falla de transporte (sin conexión, DNS, timeout): no hubo respuesta HTTP. */
export class ErrorDeRed extends Error {
  constructor(causa?: unknown) {
    super('No se pudo conectar con el servidor.');
    this.name = 'ErrorDeRed';
    this.cause = causa;
  }
}

/** Mensaje mostrable al usuario a partir de cualquier error del cliente HTTP. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi || error instanceof ErrorDeRed) return error.message;
  return 'Ocurrió un error inesperado.';
}
