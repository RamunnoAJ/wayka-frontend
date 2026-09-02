import type { CitaConPaciente } from '../../api/cita';
import { instanteEnLaClinica } from '../../lib/zona';
import { aIso, desdeIso, diaDeInstante, diaYMes, fechaCorta, mesYAnio } from '../paciente/formato';

/**
 * La aritmética de la grilla del calendario.
 *
 * Vive aparte del componente porque es lo único de esta pantalla que se puede
 * equivocar en silencio: una semana que arranca el domingo o un mes al que le
 * falta la última fila no rompen nada, solo esconden una cita. Acá se puede
 * probar sin montar la pantalla.
 *
 * Todo se maneja como `YYYY-MM-DD` —el día del calendario, no un instante— y se
 * opera con `desdeIso`, que arma el día en hora local sin corrimiento de zona;
 * `new Date(iso)` lo leería como UTC y en Argentina daría el día anterior. Cada
 * cita, en cambio, se ubica en el día
 * de **su** clínica (`diaDeInstante`): un tutor puede tener mascotas en husos
 * distintos y un solo criterio movería turnos de casillero.
 */
export const MODO_DE_CALENDARIO = {
  DIA: 'dia',
  SEMANA: 'semana',
  MES: 'mes',
} as const;

export type ModoDeCalendario = (typeof MODO_DE_CALENDARIO)[keyof typeof MODO_DE_CALENDARIO];

/**
 * Iniciales de la fila de encabezado, de lunes a domingo. La semana argentina
 * empieza el lunes, así que el fin de semana queda junto y a la derecha.
 */
export const INICIALES_DE_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Suma días de calendario. Cae bien en fin de mes y en fin de año. */
export function sumarDias(iso: string, dias: number): string {
  const d = desdeIso(iso);
  d.setDate(d.getDate() + dias);
  return aIso(d);
}

/** El lunes de la semana que contiene ese día. */
export function inicioDeSemana(iso: string): string {
  const diaDeLaSemana = desdeIso(iso).getDay();
  // `getDay()` da 0 el domingo, que en una semana que arranca el lunes es el
  // séptimo día y no el primero.
  return sumarDias(iso, -((diaDeLaSemana + 6) % 7));
}

export function diasDeLaSemana(iso: string): string[] {
  const lunes = inicioDeSemana(iso);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

/**
 * Las casillas del mes que contiene ese día: semanas enteras desde el lunes
 * anterior al día 1 hasta el domingo posterior al último. Los días de los meses
 * vecinos que completan la primera y la última fila entran en la grilla — se
 * dibujan apagados, pero se pueden elegir: una cita del 1 de octubre vista desde
 * septiembre sigue siendo una cita.
 */
export function celdasDelMes(iso: string): string[] {
  const d = desdeIso(iso);
  const primero = aIso(new Date(d.getFullYear(), d.getMonth(), 1));
  const ultimo = aIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));

  const celdas: string[] = [];
  let cursor = inicioDeSemana(primero);
  while (cursor <= ultimo || celdas.length % 7 !== 0) {
    celdas.push(cursor);
    cursor = sumarDias(cursor, 1);
  }
  return celdas;
}

export function celdasDelPeriodo(iso: string, modo: ModoDeCalendario): string[] {
  if (modo === MODO_DE_CALENDARIO.DIA) return [iso];
  return modo === MODO_DE_CALENDARIO.SEMANA ? diasDeLaSemana(iso) : celdasDelMes(iso);
}

/**
 * El período anterior o el siguiente. En mes salta al día 1 y no al "mismo día
 * del mes que viene": desde el 31 de agosto, sumar un mes calendario daría el 1
 * de octubre y se saltearía septiembre entero.
 */
export function desplazarPeriodo(iso: string, modo: ModoDeCalendario, pasos: number): string {
  if (modo === MODO_DE_CALENDARIO.DIA) return sumarDias(iso, pasos);
  if (modo === MODO_DE_CALENDARIO.SEMANA) return sumarDias(inicioDeSemana(iso), pasos * 7);
  const d = desdeIso(iso);
  return aIso(new Date(d.getFullYear(), d.getMonth() + pasos, 1));
}

/**
 * El título del período. En semana el año va una sola vez si los dos extremos lo
 * comparten, y el mes también: `1 – 7 sep 2026`, `31 ago – 6 sep 2026`,
 * `29 dic 2025 – 4 ene 2026`.
 */
export function tituloDePeriodo(iso: string, modo: ModoDeCalendario): string {
  if (modo === MODO_DE_CALENDARIO.DIA) return fechaCorta(iso);
  if (modo === MODO_DE_CALENDARIO.MES) return mesYAnio(iso);

  const dias = diasDeLaSemana(iso);
  const desde = dias[0] as string;
  const hasta = dias[6] as string;
  const [anioDesde, mesDesde] = desde.split('-');
  const [anioHasta, mesHasta] = hasta.split('-');

  if (anioDesde !== anioHasta) return `${fechaCorta(desde)} – ${fechaCorta(hasta)}`;
  if (mesDesde !== mesHasta) return `${diaYMes(desde)} – ${fechaCorta(hasta)}`;
  return `${desdeIso(desde).getDate()} – ${fechaCorta(hasta)}`;
}

/** Si ese día pertenece al mes que la grilla está mostrando. */
export function esDelMes(iso: string, ancla: string): boolean {
  return iso.slice(0, 7) === ancla.slice(0, 7);
}

/**
 * El período como intervalo de instantes, que es lo que pide la API: `desde`
 * inclusive, `hasta` exclusivo. Los bordes son medianoches **de la clínica** y
 * no del dispositivo — con el reloj del navegador, un turno de las 23:30 del
 * último día del mes se caería de la consulta.
 *
 * La zona es la de la clínica que atiende, que es la única en juego para un
 * veterinario: sus citas son las de su clínica.
 */
export function rangoDelPeriodo(
  iso: string,
  modo: ModoDeCalendario,
  zona?: string,
): { desde: string; hasta: string } {
  const celdas = celdasDelPeriodo(iso, modo);
  const primera = celdas[0] as string;
  const ultima = celdas[celdas.length - 1] as string;
  return {
    desde: instanteEnLaClinica(primera, 0, zona).toISOString(),
    hasta: instanteEnLaClinica(sumarDias(ultima, 1), 0, zona).toISOString(),
  };
}

/**
 * Las citas por día del calendario, cada una en la zona de la clínica que
 * atiende a esa mascota, y ordenadas por hora dentro del día.
 */
export function agruparPorDia(citas: CitaConPaciente[]): Map<string, CitaConPaciente[]> {
  const mapa = new Map<string, CitaConPaciente[]>();
  for (const fila of citas) {
    const clave = diaDeInstante(fila.cita.fecha_programada, fila.zona_horaria);
    const dia = mapa.get(clave);
    if (dia) dia.push(fila);
    else mapa.set(clave, [fila]);
  }
  for (const dia of mapa.values()) {
    dia.sort((a, b) => a.cita.fecha_programada.localeCompare(b.cita.fecha_programada));
  }
  return mapa;
}
