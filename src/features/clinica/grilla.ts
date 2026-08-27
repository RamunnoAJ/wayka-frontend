import type { Clinica, HoraDelDia } from '../../api/clinica';

/**
 * Aritmética de la grilla de turnos. Vive en `features` y no en `api` porque no
 * es cliente HTTP: es la misma cuenta que hace el backend en
 * `validarContraLaGrilla`, replicada para no ofrecer horas que la API va a
 * rechazar — no para reemplazar esa validación, que sigue siendo la única que
 * decide.
 */
/** `09:30` → `570`. Toda la aritmética de la grilla es en minutos. */
export function minutosDeHora(hora: HoraDelDia): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return (horas ?? 0) * 60 + (minutos ?? 0);
}

export function horaDeMinutos(minutos: number): HoraDelDia {
  const horas = Math.floor(minutos / 60);
  return `${String(horas).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

export interface Turno {
  /** Momento del turno, ISO 8601 con zona, listo para mandar al backend. */
  valor: string;
  /** `09:30`, para mostrar. */
  etiqueta: string;
  /** `false` cuando el turno ya pasó: se muestra pero no se puede elegir. */
  disponible: boolean;
}

/**
 * Genera la grilla de un día: los turnos que entran enteros en el horario de
 * atención, empezando en la apertura y avanzando de a `duracion_turno_minutos`.
 *
 * **Se construye en la zona del dispositivo.** El backend interpreta el horario
 * de la clínica en `America/Argentina/Buenos_Aires`; mientras el veterinario
 * esté en esa zona coinciden, y desde otra zona la grilla saldría corrida. Es
 * una limitación conocida del MVP, que atiende una sola clínica argentina.
 */
export function turnosDelDia(clinica: Clinica, diaIso: string, ahora = new Date()): Turno[] {
  const [anio, mes, dia] = diaIso.split('-').map(Number);
  const apertura = minutosDeHora(clinica.hora_apertura);
  const cierre = minutosDeHora(clinica.hora_cierre);
  const duracion = clinica.duracion_turno_minutos;

  if (!duracion || duracion <= 0 || cierre <= apertura) return [];

  const turnos: Turno[] = [];
  for (let minutos = apertura; minutos + duracion <= cierre; minutos += duracion) {
    const momento = new Date(
      anio ?? 0,
      (mes ?? 1) - 1,
      dia ?? 1,
      Math.floor(minutos / 60),
      minutos % 60,
    );
    turnos.push({
      valor: momento.toISOString(),
      etiqueta: horaDeMinutos(minutos),
      disponible: momento.getTime() > ahora.getTime(),
    });
  }
  return turnos;
}
