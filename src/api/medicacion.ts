import { http } from '../lib/http';

import type { OrigenDeCarga, PrecisionDeFecha } from './historial';

/**
 * Medicación. Una medicación está **activa** cuando `fecha_fin` es null — es la
 * definición del contrato y el filtro con el que se arma la vista de urgencia
 * (Modelo de Datos, 4.6).
 *
 * Regla 2.2, que la UI refleja aunque no la aplique: no se abre una segunda
 * medicación activa de la misma droga. Hay que cerrar la anterior.
 */

export interface Medicacion {
  id: string;
  paciente_id: string;
  /**
   * Cuenta que cargó el tratamiento. No se reasigna al cerrarlo ni al
   * corregirlo. Es una cuenta y no un veterinario porque cargan los dos roles.
   */
  usuario_id: string;
  /** Lo indicó el profesional, o lo declaró el tutor (Reglas de Negocio, 4.23). */
  cargado_por: OrigenDeCarga;
  nombre_droga: string;
  /** En null cuando la declaró el tutor sin saberla. El veterinario la carga siempre. */
  dosis?: string | null;
  /** Misma regla que `dosis`. */
  frecuencia?: string | null;
  fecha_inicio: string;
  /** Con qué precisión se conoce `fecha_inicio`. No se muestra sin leerla. */
  fecha_precision: PrecisionDeFecha;
  /** En null: activa. Con fecha: cierre efectivo del tratamiento. */
  fecha_fin?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FiltrosDeMedicacion {
  /** `true` deja solo las activas; omitirlo trae activas e históricas. */
  activa?: boolean;
  limite?: number;
  desplazamiento?: number;
}

export interface CrearMedicacionEntrada {
  nombre_droga: string;
  /** Obligatorias para el veterinario; opcionales cuando las declara el tutor. */
  dosis?: string;
  frecuencia?: string;
  /** Inicio del tratamiento. No puede ser futuro. */
  fecha_inicio: string;
  /** Un valor distinto de `dia` solo lo admite una medicación declarada por el tutor. */
  fecha_precision?: PrecisionDeFecha;
}

function rutaDePaciente(pacienteId: string): string {
  return `/pacientes/${pacienteId}/medicaciones`;
}

export function listarMedicaciones(
  pacienteId: string,
  filtros: FiltrosDeMedicacion = {},
): Promise<Medicacion[]> {
  return http.get<Medicacion[]>(rutaDePaciente(pacienteId), { params: { ...filtros } });
}

/** Toda medicación nace activa: `fecha_fin` no se envía en el alta. */
export function crearMedicacion(
  pacienteId: string,
  entrada: CrearMedicacionEntrada,
): Promise<Medicacion> {
  return http.post<Medicacion>(rutaDePaciente(pacienteId), { body: entrada });
}

/**
 * Cierra el tratamiento. Es la **única** edición que admite una Medicación: la
 * droga, la dosis y la frecuencia no se corrigen — se cierra y se indica otra.
 *
 * `fecha_fin` no puede ser anterior a `fecha_inicio` ni futura.
 */
export function cerrarMedicacion(medicacionId: string, fechaFin: string): Promise<Medicacion> {
  return http.patch<Medicacion>(`/medicaciones/${medicacionId}`, { body: { fecha_fin: fechaFin } });
}

/** Reabre un tratamiento cerrado por error. Misma ruta, `fecha_fin` en null. */
export function reabrirMedicacion(medicacionId: string): Promise<Medicacion> {
  return http.patch<Medicacion>(`/medicaciones/${medicacionId}`, { body: { fecha_fin: null } });
}

export function darDeBajaMedicacion(medicacionId: string): Promise<null> {
  return http.delete<null>(`/medicaciones/${medicacionId}`);
}

/** Separa el listado en los dos grupos que muestra la ficha. */
export function partirPorVigencia(medicaciones: Medicacion[]): {
  activas: Medicacion[];
  historicas: Medicacion[];
} {
  const activas: Medicacion[] = [];
  const historicas: Medicacion[] = [];
  for (const m of medicaciones) {
    if (m.fecha_fin == null) activas.push(m);
    else historicas.push(m);
  }
  return { activas, historicas };
}
