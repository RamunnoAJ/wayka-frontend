import type { DiaDeLaSemana, FranjaDeAtencion, Grilla, HoraDelDia } from '../../api/clinica';
import { instanteEnLaClinica } from '../../lib/zona';

/**
 * Aritmética de la grilla de turnos. Vive en `features` y no en `api` porque no
 * es cliente HTTP: es la misma cuenta que hace el backend en `Grilla.Admite`,
 * replicada para no ofrecer horas que la API va a rechazar — no para reemplazar
 * esa validación, que sigue siendo la única que decide.
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

/**
 * Traduce el domingo-primero de `Date.getDay()` al lunes-primero del dominio. Es
 * la única conversión entre los dos, a propósito: repetir el `(x + 6) % 7` en
 * cada llamada es como termina invertido en una.
 *
 * La fecha se interpreta como día calendario y no como instante: `2027-01-01` es
 * viernes en cualquier zona, y usar `new Date(iso)` la leería como medianoche
 * UTC, que al oeste de Greenwich es el jueves.
 */
export function diaDeLaSemanaDe(diaIso: string): DiaDeLaSemana {
  const [anio, mes, dia] = diaIso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio ?? 1970, (mes ?? 1) - 1, dia ?? 1));
  return ((fecha.getUTCDay() + 6) % 7) as DiaDeLaSemana;
}

export function franjasDelDia(grilla: Grilla, dia: DiaDeLaSemana): FranjaDeAtencion[] {
  return grilla.franjas
    .filter((franja) => franja.dia_semana === dia)
    .sort((una, otra) => minutosDeHora(una.hora_desde) - minutosDeHora(otra.hora_desde));
}

/** Cuántos turnos entran en la franja. Es la capacidad de ese tramo. */
export function turnosDeFranja(franja: FranjaDeAtencion, duracionMinutos: number): number {
  if (duracionMinutos <= 0) return 0;
  const largo = minutosDeHora(franja.hora_hasta) - minutosDeHora(franja.hora_desde);
  return largo > 0 ? Math.floor(largo / duracionMinutos) : 0;
}

export function turnosDelDiaDeLaSemana(grilla: Grilla, dia: DiaDeLaSemana): number {
  return franjasDelDia(grilla, dia).reduce(
    (total, franja) => total + turnosDeFranja(franja, grilla.duracion_turno_minutos),
    0,
  );
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
 * Genera la grilla de un día: los turnos que entran enteros en alguna franja de
 * ese día de la semana, contando desde el comienzo de **cada** franja.
 *
 * Un día sin franjas devuelve una grilla vacía, que es lo que un día cerrado
 * tiene para ofrecer. Y el hueco entre dos franjas no genera turnos: el corte de
 * mediodía es un hueco, no una pausa que el turno pueda atravesar.
 *
 * Los momentos se construyen en la **`zona_horaria` de la clínica**, no en la del
 * dispositivo: el backend interpreta el horario de atención en esa zona, y una
 * grilla armada con el reloj del veterinario saldría corrida desde cualquier
 * otro lado.
 */
export function turnosDelDia(grilla: Grilla, diaIso: string, ahora = new Date()): Turno[] {
  const duracion = grilla.duracion_turno_minutos;
  if (!duracion || duracion <= 0) return [];

  const turnos: Turno[] = [];
  for (const franja of franjasDelDia(grilla, diaDeLaSemanaDe(diaIso))) {
    const desde = minutosDeHora(franja.hora_desde);
    const hasta = minutosDeHora(franja.hora_hasta);
    for (let minutos = desde; minutos + duracion <= hasta; minutos += duracion) {
      const momento = instanteEnLaClinica(diaIso, minutos, grilla.zona_horaria);
      turnos.push({
        valor: momento.toISOString(),
        etiqueta: horaDeMinutos(minutos),
        disponible: momento.getTime() > ahora.getTime(),
      });
    }
  }
  return turnos;
}
