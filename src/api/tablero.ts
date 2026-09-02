import { http } from '../lib/http';

import type { DiaDeLaSemana } from './clinica';

/**
 * Conteos de gestión de la clínica, para su clinica_admin.
 *
 * Ninguna propiedad identifica a un paciente ni lleva dato clínico: la decisión
 * es que un conteo sin `paciente_id` ni dato clínico no es historial clínico, y
 * el límite está puesto en la forma del dato —un número con su corte— y no en la
 * entidad de la que sale (Modelo de Datos, 5).
 */
export type PeriodoDelTablero = 'semana' | 'mes';

export interface ConteoPorProfesional {
  veterinario_id: string;
  nombre: string;
  cantidad: number;
}

export interface OcupacionDeLaGrilla {
  /** Sale de las franjas y de la duración del turno: capacidad calculada, no guardada. */
  turnos_disponibles: number;
  turnos_ocupados: number;
  /** La cola de lo que hay que repartir. Crece sola cuando se carga una ausencia. */
  sin_asignar: number;
  por_profesional: ConteoPorProfesional[];
}

export interface AtencionesDelPeriodo {
  total: number;
  por_profesional: ConteoPorProfesional[];
  por_origen: Record<string, number>;
}

export interface CarteraDelPeriodo {
  pacientes_vigentes: number;
  altas_del_periodo: number;
  altas_por_origen: Record<string, number>;
}

export interface Tablero {
  periodo: PeriodoDelTablero;
  desde: string;
  hasta: string;
  ocupacion: OcupacionDeLaGrilla;
  atenciones: AtencionesDelPeriodo;
  cartera: CarteraDelPeriodo;
}

export interface TurnosPorDiaDelTablero {
  dia_semana: DiaDeLaSemana;
  turnos: number;
}

/**
 * Un solo endpoint para los tres bloques, con un único período: comparar la
 * ocupación de la semana contra las atenciones del mes es leer dos cosas que no
 * se corresponden.
 *
 * Sin `referencia`, el período es el que corre hoy.
 */
export function obtenerTablero(
  clinicaId: string,
  periodo: PeriodoDelTablero,
  referencia?: string,
): Promise<Tablero> {
  return http.get<Tablero>(`/clinicas/${clinicaId}/tablero`, {
    params: { periodo, ...(referencia ? { referencia } : {}) },
  });
}
