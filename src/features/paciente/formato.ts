/**
 * Formato de los datos de la ficha. Vive acá y no en cada componente para que
 * una fecha se lea igual en el timeline, en la banda de urgencia y en el
 * calendario.
 *
 * Todo lo que el contrato manda como `date` es un `YYYY-MM-DD` sin zona. No se
 * parsea con `new Date(iso)`: eso lo interpreta como UTC y en Argentina
 * (UTC-3) devuelve el día anterior. Se parte a mano.
 */

import { PRECISION_DE_FECHA, type PrecisionDeFecha } from '../../api/historial';
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

/**
 * Muestra solo lo que la fecha afirma. Un antecedente que el tutor declaró como
 * "en 2023" viaja como `2023-01-01` con `fecha_precision = anio`: el día y el
 * mes son relleno del contrato, no algo que alguien haya dicho, y escribirlos
 * sería inventar una precisión que no existe (Modelo de Datos, 4.5).
 *
 * `2023-01-01` → `2023` con precisión de año, `ene 2023` con precisión de mes,
 * y `1 ene 2023` con precisión de día, que es el caso normal.
 */
export function fechaConPrecision(iso: string, precision: PrecisionDeFecha): string {
  const d = desdeIso(iso);
  if (precision === PRECISION_DE_FECHA.ANIO) return String(d.getFullYear());
  if (precision === PRECISION_DE_FECHA.MES) return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
  return fechaCorta(iso);
}

/** `2026-08-27` → `27 ago`, sin el año: el extremo de un rango que ya lo dice. */
export function diaYMes(iso: string): string {
  const d = desdeIso(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** `2026-08-31` → `lun`. */
export function diaDeSemanaCorto(iso: string): string {
  return DIAS_DE_SEMANA[desdeIso(iso).getDay()] ?? '';
}

const MESES_LARGOS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * `2026-09-05` → `septiembre 2026`. El encabezado de un mes de calendario, donde
 * la abreviatura de tres letras se lee como un dato y no como un título.
 */
export function mesYAnio(iso: string): string {
  const d = desdeIso(iso);
  return `${MESES_LARGOS[d.getMonth()]} ${d.getFullYear()}`;
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
 * Peso con un decimal y sin el cero final: `2,6 kg`, `12 kg`. Coma decimal,
 * como se escribe en una historia clínica en castellano.
 *
 * Se muestra redondeado aunque el contrato lo persista al gramo (Modelo de
 * Datos, 4.2). Los tres decimales son la precisión con la que se **guarda** y
 * se compara —un `double` redondearía de formas que en una historia clínica se
 * notan—, pero no la que hace falta leer: en un perro de 31 kg, el gramo es
 * ruido en una tarjeta.
 *
 * Por debajo del kilo se mantiene el gramo, y esa es la excepción que justifica
 * el NUMERIC: en una calopsita de 95 gramos, un decimal es `0,1 kg` y el
 * redondeo se come el dato entero.
 */
export function peso(kilos: number): string {
  const texto = kilos.toFixed(kilos < 1 ? 3 : 1);
  // `toFixed` siempre deja punto acá (nunca se pide 0 decimales), así que
  // recortar los ceros no puede comerse un dígito entero.
  const sinCeros = texto.replace(/0+$/, '').replace(/\.$/, '');
  return `${sinCeros.replace('.', ',')} kg`;
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
export function diaDeInstante(iso: string, zona?: string): string {
  return diaEnLaClinica(new Date(iso), zona);
}

/** `2026-09-05T09:30:00-03:00` → `09:30`, la hora que marca el reloj de la clínica. */
export function horaCorta(iso: string, zona?: string): string {
  return horaEnLaClinica(new Date(iso), zona);
}

/**
 * `sáb 5 sep 2026 · 09:30`, que es como se lee un turno.
 *
 * Lleva el día de la semana por el mismo motivo que el selector: para decidir
 * si reagendar hace falta saber qué día cae la cita que se está moviendo, y el
 * número del día solo no lo dice.
 */
export function momentoCorto(iso: string, zona?: string): string {
  return `${fechaConDiaDeSemana(diaDeInstante(iso, zona))} · ${horaCorta(iso, zona)}`;
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
