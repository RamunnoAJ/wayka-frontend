import type { Ausencia } from '../../api/ausencia';

/**
 * Quién no está ahora mismo, indexado por profesional.
 *
 * Es la mirada transversal que se perdió al sacar la sección de Ausencias: la
 * lista de una persona vive en su ficha, pero "quién falta hoy" es una pregunta
 * que se hace mirando el plantel entero, y sin esto habría que abrir ficha por
 * ficha.
 */
export interface AusenciaVigente {
  hasta: Date;
}

export function estaAusenteAhora(
  ausencias: Ausencia[] | undefined,
  ahora = new Date(),
): Map<string, AusenciaVigente> {
  const vigentes = new Map<string, AusenciaVigente>();
  const instante = ahora.getTime();

  for (const ausencia of ausencias ?? []) {
    const desde = new Date(ausencia.desde).getTime();
    const hasta = new Date(ausencia.hasta);
    // El fin es exclusivo, como todo rango del sistema.
    if (instante < desde || instante >= hasta.getTime()) continue;

    // Con dos solapadas gana la que termina más tarde: lo que la fila responde
    // es "hasta cuándo no está", y la más corta daría una fecha que ya pasó.
    const previa = vigentes.get(ausencia.veterinario_id);
    if (!previa || hasta > previa.hasta) vigentes.set(ausencia.veterinario_id, { hasta });
  }
  return vigentes;
}
