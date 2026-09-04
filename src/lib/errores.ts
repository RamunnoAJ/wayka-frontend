/**
 * Códigos de error del backend. Son estables y son por lo que hay que
 * preguntar: el `mensaje` que los acompaña es **diagnóstico** —sirve para un log
 * o para depurar— y no está escrito para mostrarse tal cual (`Error` en
 * `openapi/openapi.yaml`).
 */
export const CODIGO_ERROR = {
  NO_AUTENTICADO: 'no_autenticado',
  DATOS_INVALIDOS: 'datos_invalidos',
  CREDENCIALES_INVALIDAS: 'credenciales_invalidas',
  PERMISO_DENEGADO: 'permiso_denegado',
  NO_ENCONTRADO: 'no_encontrado',
  CONFLICTO: 'conflicto',
  DOCUMENTO_EN_USO: 'documento_en_uso',
  MATRICULA_EN_USO: 'matricula_en_uso',
  EMAIL_EN_USO: 'email_en_uso',
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

/**
 * El copy de cada código, escrito acá y no en el servidor.
 *
 * Describe el problema y la salida, sin culpar a quien está del otro lado
 * (design system, §Content fundamentals). Es deliberadamente neutro de
 * contexto: la pantalla que puede decir algo más preciso lo pasa en `propios`.
 */
const COPY_POR_CODIGO: Record<string, string> = {
  [CODIGO_ERROR.NO_AUTENTICADO]: 'La sesión venció. Entrá de nuevo para seguir.',
  [CODIGO_ERROR.CREDENCIALES_INVALIDAS]: 'Revisá el correo y la contraseña.',
  [CODIGO_ERROR.PERMISO_DENEGADO]: 'Esta cuenta no puede hacer eso.',
  [CODIGO_ERROR.NO_ENCONTRADO]: 'Eso ya no está. Puede haberse dado de baja mientras mirabas.',
  [CODIGO_ERROR.DATOS_INVALIDOS]: 'Revisá los datos cargados: alguno no es válido.',
  [CODIGO_ERROR.CONFLICTO]:
    'Algo cambió desde que abriste la pantalla. Volvé a cargarla y probá otra vez.',
  [CODIGO_ERROR.DOCUMENTO_EN_USO]: 'Ese documento ya está cargado en otra ficha.',
  [CODIGO_ERROR.MATRICULA_EN_USO]: 'Esa matrícula ya está cargada en otra ficha.',
  [CODIGO_ERROR.EMAIL_EN_USO]: 'Ese correo ya tiene una cuenta.',
  [CODIGO_ERROR.ARCHIVO_DEMASIADO_GRANDE]: 'El archivo es muy pesado. Probá con uno más liviano.',
  [CODIGO_ERROR.ERROR_INTERNO]: 'No se pudo completar. Probá de nuevo en un momento.',
};

/**
 * Mensaje mostrable al usuario a partir de cualquier error del cliente HTTP.
 *
 * **Nunca devuelve el `mensaje` del servidor.** Ese texto está escrito para un
 * log —sin tildes, en minúscula y sin salida— y llegaba tal cual a la pantalla.
 *
 * `propios` deja que una pantalla afine el copy de un código con lo que ella
 * sabe y el servidor no: para la agenda, un `conflicto` es siempre "esa hora ya
 * está tomada", y decirlo así es mejor que el genérico.
 */
export function mensajeDeError(error: unknown, propios?: Record<string, string>): string {
  if (error instanceof ErrorDeRed) return error.message;

  if (error instanceof ErrorApi && error.codigo) {
    const propio = propios?.[error.codigo];
    if (propio) return propio;
    const conocido = COPY_POR_CODIGO[error.codigo];
    if (conocido) return conocido;
  }

  return 'No se pudo completar. Probá de nuevo en un momento.';
}
