/**
 * La suite entera corre en Tokio (ver `jest.global-setup.js`), que está 12 horas
 * adelante de la clínica. Eso es lo que reproduce el bug que este módulo
 * arregla: cualquier cálculo que use el reloj del dispositivo sale corrido de
 * día y de hora, no de minutos.
 */
import {
  diaEnLaClinica,
  horaEnLaClinica,
  hoyEnLaClinica,
  instanteEnLaClinica,
  partesEnLaClinica,
  ZONA_POR_DEFECTO,
} from './zona';

describe('la zona del dispositivo no es la de la clínica', () => {
  it('el entorno de la prueba está efectivamente en otra zona', () => {
    // Si esto falla, el resto de la suite no prueba lo que dice probar.
    expect(new Date().getTimezoneOffset()).not.toBe(180);
    expect(ZONA_POR_DEFECTO).toBe('America/Argentina/Buenos_Aires');
  });
});

describe('instanteEnLaClinica', () => {
  it('arma el momento con el reloj de la clínica y no con el del dispositivo', () => {
    // Las 09:30 en Buenos Aires (UTC-3) son las 12:30 UTC.
    const instante = instanteEnLaClinica('2027-01-04', 9 * 60 + 30);

    expect(instante.toISOString()).toBe('2027-01-04T12:30:00.000Z');
  });

  it('va y vuelve sin corrimiento', () => {
    const casos: [string, number][] = [
      ['2027-01-04', 9 * 60],
      ['2027-06-15', 17 * 60 + 30],
      ['2027-12-31', 23 * 60 + 59],
    ];

    for (const [dia, minutos] of casos) {
      const instante = instanteEnLaClinica(dia, minutos);
      expect(diaEnLaClinica(instante)).toBe(dia);
      expect(horaEnLaClinica(instante)).toBe(
        `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`,
      );
    }
  });

  it('resuelve la medianoche sin saltar de día', () => {
    const instante = instanteEnLaClinica('2027-03-10', 0);

    expect(diaEnLaClinica(instante)).toBe('2027-03-10');
    expect(horaEnLaClinica(instante)).toBe('00:00');
  });
});

describe('lectura de un instante', () => {
  it('un turno de la mañana en la clínica no se lee como del día anterior', () => {
    // 09:00 en Buenos Aires es la medianoche del día siguiente en Tokio: leerlo
    // con el reloj del dispositivo movía el turno de día.
    const instante = new Date('2027-01-04T12:00:00.000Z');

    expect(diaEnLaClinica(instante)).toBe('2027-01-04');
    expect(horaEnLaClinica(instante)).toBe('09:00');
  });

  it('un turno de la tarde tampoco se corre', () => {
    // 21:00 UTC son las 18:00 en Buenos Aires y las 06:00 del día siguiente en
    // Tokio.
    const instante = new Date('2027-01-04T21:00:00.000Z');

    expect(diaEnLaClinica(instante)).toBe('2027-01-04');
    expect(horaEnLaClinica(instante)).toBe('18:00');
  });

  it('descompone el instante en las partes que ve la clínica', () => {
    expect(partesEnLaClinica(new Date('2027-07-09T02:15:00.000Z'))).toEqual({
      anio: 2027,
      mes: 7,
      dia: 8,
      hora: 23,
      minuto: 15,
    });
  });
});

describe('hoyEnLaClinica', () => {
  it('puede no ser el mismo día que en el dispositivo', () => {
    // 23:00 UTC del 4 de enero: en Buenos Aires siguen siendo las 20:00 del 4, y
    // en Tokio ya son las 08:00 del 5.
    const ahora = new Date('2027-01-04T23:00:00.000Z');

    expect(hoyEnLaClinica(ZONA_POR_DEFECTO, ahora)).toBe('2027-01-04');
    expect(new Date(ahora).getDate()).toBe(5);
  });
});

describe('la zona es un dato de la clínica', () => {
  it('el mismo instante se lee distinto según la zona que se pida', () => {
    const instante = new Date('2027-01-04T12:00:00.000Z');

    expect(horaEnLaClinica(instante, 'America/Argentina/Buenos_Aires')).toBe('09:00');
    expect(horaEnLaClinica(instante, 'Europe/Madrid')).toBe('13:00');
    expect(horaEnLaClinica(instante, 'Asia/Tokyo')).toBe('21:00');
  });

  it('arma el momento en la zona que se le pide', () => {
    // Las 09:30 en Madrid son las 08:30 UTC en enero.
    expect(instanteEnLaClinica('2027-01-04', 9 * 60 + 30, 'Europe/Madrid').toISOString()).toBe(
      '2027-01-04T08:30:00.000Z',
    );
  });

  it('una zona desconocida cae en la del piloto en vez de romperse', () => {
    const instante = new Date('2027-01-04T12:00:00.000Z');

    expect(horaEnLaClinica(instante, 'Marte/Olympus')).toBe('09:00');
    expect(horaEnLaClinica(instante, '')).toBe('09:00');
  });
});
