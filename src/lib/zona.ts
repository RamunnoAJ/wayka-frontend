/**
 * Zona horaria de la clínica.
 *
 * El backend interpreta el horario de atención y la grilla de turnos en
 * `America/Argentina/Buenos_Aires` (`internal/negocio/fechas.go`). Este módulo
 * hace que el cliente use **esa** zona y no la del dispositivo: sin esto, un
 * veterinario que abre la web desde otra zona ve la grilla corrida y arma
 * momentos que la API rechaza, o peor, acepta a la hora equivocada.
 *
 * La constante está duplicada entre los dos repos a propósito acotado: hoy
 * ninguno de los dos lados la tiene como dato. Cuando `Clinica` tenga su propia
 * zona horaria en el contrato, este módulo la recibe como parámetro y la
 * constante queda solo como valor por defecto.
 */
export const ZONA_DE_LA_CLINICA = 'America/Argentina/Buenos_Aires';

const formateador = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_DE_LA_CLINICA,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export interface PartesDeFecha {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

/** Un instante, leído como lo vería un reloj de pared en la clínica. */
export function partesEnLaClinica(instante: Date): PartesDeFecha {
  const partes: Record<string, string> = {};
  for (const parte of formateador.formatToParts(instante)) {
    if (parte.type !== 'literal') partes[parte.type] = parte.value;
  }
  return {
    anio: Number(partes.year),
    mes: Number(partes.month),
    dia: Number(partes.day),
    // A la medianoche, `hour12: false` puede devolver 24 en vez de 0.
    hora: Number(partes.hour) % 24,
    minuto: Number(partes.minute),
  };
}

/**
 * Minutos que la zona de la clínica está adelantada respecto de UTC en ese
 * instante. Se calcula y no se fija porque una zona con horario de verano cambia
 * de desfasaje según la fecha — Argentina hoy no lo usa, pero atarlo a -180 haría
 * que mudar de zona sea un bug silencioso en vez de un cambio de constante.
 */
function desfasajeEnMinutos(instante: Date): number {
  const { anio, mes, dia, hora, minuto } = partesEnLaClinica(instante);
  const comoSiFueraUTC = Date.UTC(anio, mes - 1, dia, hora, minuto, instante.getUTCSeconds());
  return Math.round((comoSiFueraUTC - instante.getTime()) / 60_000);
}

/**
 * El instante en que, **en la clínica**, el reloj marca ese día a esa hora.
 *
 * Se resuelve en dos pasadas: la primera supone que la hora local es UTC y mide
 * el desfasaje ahí; la segunda lo vuelve a medir sobre el instante ya corregido.
 * Cerca de un cambio de horario de verano las dos mediciones difieren, y quedarse
 * con la primera dejaría el turno una hora corrido.
 */
export function instanteEnLaClinica(diaIso: string, minutosDelDia: number): Date {
  const [anio, mes, dia] = diaIso.split('-').map(Number);
  const comoSiFueraUTC = Date.UTC(
    anio ?? 0,
    (mes ?? 1) - 1,
    dia ?? 1,
    Math.floor(minutosDelDia / 60),
    minutosDelDia % 60,
  );

  const primera = new Date(comoSiFueraUTC - desfasajeEnMinutos(new Date(comoSiFueraUTC)) * 60_000);
  return new Date(comoSiFueraUTC - desfasajeEnMinutos(primera) * 60_000);
}

/** `YYYY-MM-DD` del día que ese instante cae en la clínica. */
export function diaEnLaClinica(instante: Date): string {
  const { anio, mes, dia } = partesEnLaClinica(instante);
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** `HH:MM` que marca el reloj de la clínica en ese instante. */
export function horaEnLaClinica(instante: Date): string {
  const { hora, minuto } = partesEnLaClinica(instante);
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}

/** Hoy en la clínica, que puede no ser hoy en el dispositivo. */
export function hoyEnLaClinica(ahora = new Date()): string {
  return diaEnLaClinica(ahora);
}
