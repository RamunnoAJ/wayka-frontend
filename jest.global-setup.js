/**
 * Toda la suite corre en una zona horaria **distinta** de la de la clínica.
 *
 * Es deliberado: el cliente tiene que resolver fechas y horas en la zona de la
 * clínica (`src/lib/zona.ts`), no en la del dispositivo. Corriendo los tests en
 * la misma zona que el backend, cualquier código que use el reloj local pasa en
 * verde y falla recién cuando alguien abre la app desde otro lado.
 *
 * Tokio está 12 horas adelante de Buenos Aires: un error de zona sale corrido de
 * día, no de minutos, y no se puede confundir con un redondeo.
 */
module.exports = () => {
  process.env.TZ = 'Asia/Tokyo';
};
