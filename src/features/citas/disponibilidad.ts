import type { Ausencia } from '../../api/ausencia';
import type { CitaConPaciente } from '../../api/cita';

/**
 * Quién no puede atender un turno. Son las dos condiciones que el backend aplica
 * al asignar un profesional (regla 2.2), replicadas para no ofrecer algo que la
 * API va a rechazar — no para reemplazar esa validación, que sigue siendo la
 * única que decide.
 *
 * Vive acá y no adentro de una pantalla porque la misma cuenta la necesitan
 * las tres que asignan: agendar, reagendar y repartir desde la agenda. Escrita
 * tres veces, se separa en la primera corrección que toque solo a una.
 */
export interface Disponibilidad {
  /** Ya tiene otra cita pendiente en ese mismo momento. */
  ocupados: Set<string>;
  /** Tiene una ausencia cargada que cubre ese momento. */
  ausentes: Set<string>;
}

export interface EntradaDeDisponibilidad {
  /** El momento del turno, en ISO. Sin turno elegido no hay contra qué medir. */
  momento: string | null | undefined;
  /** Citas del día, para detectar el solape. */
  citas: CitaConPaciente[] | undefined;
  /** Ausencias que tocan el día. */
  ausencias: Ausencia[] | undefined;
  /** La cita que se está moviendo: no cuenta como ocupación de sí misma. */
  exceptoCitaId?: string;
}

export function calcularDisponibilidad({
  momento,
  citas,
  ausencias,
  exceptoCitaId,
}: EntradaDeDisponibilidad): Disponibilidad {
  const vacia: Disponibilidad = { ocupados: new Set(), ausentes: new Set() };
  if (!momento) return vacia;

  const instante = new Date(momento).getTime();
  if (Number.isNaN(instante)) return vacia;

  const ocupados = new Set<string>();
  for (const fila of citas ?? []) {
    const cita = fila.cita;
    if (!cita.veterinario_id || cita.id === exceptoCitaId) continue;
    if (new Date(cita.fecha_programada).getTime() === instante) ocupados.add(cita.veterinario_id);
  }

  const ausentes = new Set<string>();
  for (const ausencia of ausencias ?? []) {
    const desde = new Date(ausencia.desde).getTime();
    const hasta = new Date(ausencia.hasta).getTime();
    // El fin es exclusivo, como todo rango del sistema: una ausencia que termina
    // a las 16:00 no tapa el turno de las 16:00.
    if (instante >= desde && instante < hasta) ausentes.add(ausencia.veterinario_id);
  }

  return { ocupados, ausentes };
}

/** El motivo por el que no está disponible, o `undefined` si lo está. */
export function motivoDeNoDisponible(
  veterinarioId: string,
  disponibilidad: Disponibilidad,
): string | undefined {
  // La ausencia gana sobre el solape: si no va a estar, que tenga otra cita a esa
  // hora es una consecuencia, no el motivo por el que no se lo puede asignar.
  if (disponibilidad.ausentes.has(veterinarioId)) return 'ausente ese día';
  if (disponibilidad.ocupados.has(veterinarioId)) return 'ocupado a esa hora';
  return undefined;
}
