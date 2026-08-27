/**
 * Formato de los datos de la ficha. Vive acá y no en cada componente para que
 * una fecha se lea igual en el timeline, en la banda de urgencia y en el
 * calendario.
 *
 * Todo lo que el contrato manda como `date` es un `YYYY-MM-DD` sin zona. No se
 * parsea con `new Date(iso)`: eso lo interpreta como UTC y en Argentina
 * (UTC-3) devuelve el día anterior. Se parte a mano.
 */

import { diaEnLaClinica, horaEnLaClinica, hoyEnLaClinica } from '../../lib/zona';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS_DE_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** `2026-08-27` → `Date` local, sin corrimiento de zona. */
export function desdeIso(iso: string): Date {
  const partes = iso.split('-').map(Number);
  return new Date(partes[0] ?? 0, (partes[1] ?? 1) - 1, partes[2] ?? 1);
}

export function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** `2026-08-27` → `27 ago 2026`. */
export function fechaCorta(iso: string): string {
  const d = desdeIso(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** `2026-08-31` → `lun`. */
export function diaDeSemanaCorto(iso: string): string {
  return DIAS_DE_SEMANA[desdeIso(iso).getDay()] ?? '';
}

/**
 * `2026-08-31` → `lun 31 ago 2026`.
 *
 * El día de la semana va adelante y no entre paréntesis porque es lo primero
 * que se lee al elegir cuándo agendar: quien busca un turno piensa en "el
 * martes", no en el número del día.
 */
export function fechaConDiaDeSemana(iso: string): string {
  return `${diaDeSemanaCorto(iso)} ${fechaCorta(iso)}`;
}

/**
 * Edad en años y meses cumplidos. Debajo del año, solo meses.
 *
 * El "hoy" por defecto es el de la clínica: cerca de la medianoche, el del
 * dispositivo puede ser otro día y la mascota cumpliría años antes o después.
 */
export function edad(fechaNacimientoIso: string, hoy = desdeIso(hoyEnLaClinica())): string {
  const nacimiento = desdeIso(fechaNacimientoIso);
  let meses =
    (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth());
  if (hoy.getDate() < nacimiento.getDate()) meses -= 1;
  if (meses < 0) return 'recién nacida';

  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  if (anios === 0) return `${resto} ${resto === 1 ? 'mes' : 'meses'}`;
  if (resto === 0) return `${anios} ${anios === 1 ? 'año' : 'años'}`;
  return `${anios} ${anios === 1 ? 'año' : 'años'} ${resto} ${resto === 1 ? 'mes' : 'meses'}`;
}

/** Versión compacta para la tarjeta de datos: `4 a 3 m`. */
export function edadCompacta(fechaNacimientoIso: string, hoy = desdeIso(hoyEnLaClinica())): string {
  const nacimiento = desdeIso(fechaNacimientoIso);
  let meses =
    (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth());
  if (hoy.getDate() < nacimiento.getDate()) meses -= 1;
  if (meses < 0) return '—';
  return `${Math.floor(meses / 12)} a ${meses % 12} m`;
}

/**
 * El peso se muestra al gramo: el contrato lo persiste como NUMERIC justamente
 * para que no se redondee (Modelo de Datos, 4.2). Coma decimal, como se escribe
 * en una historia clínica en castellano.
 */
export function peso(kilos: number): string {
  return `${kilos.toFixed(3).replace('.', ',')} kg`;
}

/** Agrupa el chip en tríos para que un número de 15 dígitos se pueda leer. */
export function microchip(valor: string | null | undefined): string | null {
  if (!valor) return null;
  return valor.replace(/\s+/g, '').replace(/(.{3})(?=.)/g, '$1 ');
}

/**
 * `2026-09-05T09:30:00-03:00` → `2026-09-05`. La Cita viaja como instante ISO
 * con zona; para agrupar por día del calendario hay que mirarlo **en la zona de
 * la clínica**, no cortarle los primeros diez caracteres ni leerlo con el reloj
 * del dispositivo — en UTC el mismo turno puede caer al día siguiente.
 */
export function diaDeInstante(iso: string): string {
  return diaEnLaClinica(new Date(iso));
}

/** `2026-09-05T09:30:00-03:00` → `09:30`, la hora que marca el reloj de la clínica. */
export function horaCorta(iso: string): string {
  return horaEnLaClinica(new Date(iso));
}

/**
 * `sáb 5 sep 2026 · 09:30`, que es como se lee un turno.
 *
 * Lleva el día de la semana por el mismo motivo que el selector: para decidir
 * si reagendar hace falta saber qué día cae la cita que se está moviendo, y el
 * número del día solo no lo dice.
 */
export function momentoCorto(iso: string): string {
  return `${fechaConDiaDeSemana(diaDeInstante(iso))} · ${horaCorta(iso)}`;
}

/** Hoy en la clínica, en `YYYY-MM-DD`. Reexportado para no importar dos módulos. */
export { hoyEnLaClinica };

export function tamanoDeArchivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Primera letra en mayúscula, para especies y sexos que el contrato deja libres. */
export function capitalizar(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
