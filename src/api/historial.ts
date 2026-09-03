/**
 * Lo que comparten las dos entidades del historial —Evento clínico y
 * Medicación— desde que el tutor carga antecedentes (Reglas de Negocio, 4.23).
 *
 * Vive acá y no en uno de los dos módulos porque no es de ninguno de los dos: es
 * la forma en que el contrato distingue un acto médico documentado de lo que
 * declaró el dueño de la mascota.
 */

export const ORIGEN_DE_CARGA = {
  VETERINARIO: 'veterinario',
  TUTOR: 'tutor',
} as const;

export type OrigenDeCarga = (typeof ORIGEN_DE_CARGA)[keyof typeof ORIGEN_DE_CARGA];

export const PRECISION_DE_FECHA = {
  DIA: 'dia',
  MES: 'mes',
  ANIO: 'anio',
} as const;

export type PrecisionDeFecha = (typeof PRECISION_DE_FECHA)[keyof typeof PRECISION_DE_FECHA];

/** Todo registro del historial dice de qué clase es y con qué precisión se fecha. */
export interface RegistroDelHistorial {
  cargado_por: OrigenDeCarga;
  fecha_precision: PrecisionDeFecha;
}

export function loDeclaroElTutor(registro: RegistroDelHistorial): boolean {
  return registro.cargado_por === ORIGEN_DE_CARGA.TUTOR;
}

/**
 * Qué puede hacer el tutor sobre un registro. La UI lo refleja para no ofrecer
 * lo que el backend va a rechazar con un 403 — que es quien de verdad lo decide
 * (Reglas de Negocio, 3.2).
 */
export function elTutorLoPuedeEditar(registro: RegistroDelHistorial): boolean {
  return loDeclaroElTutor(registro);
}
