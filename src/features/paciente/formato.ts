/**
 * Formato de los datos de la ficha. Vive acá y no en cada componente para que
 * una fecha se lea igual en el timeline, en la banda de urgencia y en el
 * calendario.
 *
 * Todo lo que el contrato manda como `date` es un `YYYY-MM-DD` sin zona. No se
 * parsea con `new Date(iso)`: eso lo interpreta como UTC y en Argentina
 * (UTC-3) devuelve el día anterior. Se parte a mano.
 */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

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

/** Edad en años y meses cumplidos. Debajo del año, solo meses. */
export function edad(fechaNacimientoIso: string, hoy = new Date()): string {
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
export function edadCompacta(fechaNacimientoIso: string, hoy = new Date()): string {
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
