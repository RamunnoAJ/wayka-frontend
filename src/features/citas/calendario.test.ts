import type { CitaConPaciente } from '../../api/cita';

import {
  agruparPorDia,
  rangoDelPeriodo,
  celdasDelMes,
  celdasDelPeriodo,
  desplazarPeriodo,
  diasDeLaSemana,
  esDelMes,
  inicioDeSemana,
  MODO_DE_CALENDARIO,
  sumarDias,
  tituloDePeriodo,
} from './calendario';

function cita(id: string, fecha: string, zona = 'America/Argentina/Buenos_Aires') {
  return {
    cita: { id, fecha_programada: fecha } as CitaConPaciente['cita'],
    paciente_nombre: id,
    zona_horaria: zona,
  } as CitaConPaciente;
}

describe('la semana', () => {
  it('arranca el lunes, también cuando el día es domingo', () => {
    expect(inicioDeSemana('2026-09-02')).toBe('2026-08-31');
    expect(inicioDeSemana('2026-09-06')).toBe('2026-08-31');
    expect(inicioDeSemana('2026-08-31')).toBe('2026-08-31');
  });

  it('tiene siete días y cruza el fin de mes', () => {
    expect(diasDeLaSemana('2026-09-02')).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
  });
});

describe('el mes', () => {
  it('se dibuja en semanas enteras y contiene todos sus días', () => {
    const celdas = celdasDelMes('2026-09-15');
    expect(celdas.length % 7).toBe(0);
    expect(celdas[0]).toBe('2026-08-31');
    expect(celdas).toContain('2026-09-01');
    expect(celdas).toContain('2026-09-30');
    expect(celdas.at(-1)).toBe('2026-10-04');
  });

  it('distingue los días del mes vecino que completan la grilla', () => {
    expect(esDelMes('2026-08-31', '2026-09-15')).toBe(false);
    expect(esDelMes('2026-09-01', '2026-09-15')).toBe(true);
  });
});

describe('el desplazamiento', () => {
  it('en mes no se saltea el mes siguiente desde un día 31', () => {
    expect(desplazarPeriodo('2026-08-31', MODO_DE_CALENDARIO.MES, 1)).toBe('2026-09-01');
    expect(desplazarPeriodo('2026-01-15', MODO_DE_CALENDARIO.MES, -1)).toBe('2025-12-01');
  });

  it('en semana cae siempre en un lunes', () => {
    expect(desplazarPeriodo('2026-09-02', MODO_DE_CALENDARIO.SEMANA, 1)).toBe('2026-09-07');
    expect(desplazarPeriodo('2026-09-02', MODO_DE_CALENDARIO.SEMANA, -1)).toBe('2026-08-24');
  });

  it('suma días cruzando el fin de año', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('el rango que se le pide a la API', () => {
  it('va de la primera medianoche de la clínica a la del día siguiente al último', () => {
    // Buenos Aires es UTC-3: la medianoche del 31 de agosto allá son las 03:00
    // UTC de ese mismo día.
    expect(rangoDelPeriodo('2026-09-02', MODO_DE_CALENDARIO.SEMANA)).toEqual({
      desde: '2026-08-31T03:00:00.000Z',
      hasta: '2026-09-07T03:00:00.000Z',
    });
  });

  it('en mes cubre las casillas de los meses vecinos que la grilla muestra', () => {
    const { desde, hasta } = rangoDelPeriodo('2026-09-15', MODO_DE_CALENDARIO.MES);
    expect(desde).toBe('2026-08-31T03:00:00.000Z');
    expect(hasta).toBe('2026-10-05T03:00:00.000Z');
  });
});

describe('el título', () => {
  it('repite el mes y el año solo cuando cambian', () => {
    expect(tituloDePeriodo('2026-09-15', MODO_DE_CALENDARIO.MES)).toBe('septiembre 2026');
    expect(tituloDePeriodo('2026-09-09', MODO_DE_CALENDARIO.SEMANA)).toBe('7 – 13 sep 2026');
    expect(tituloDePeriodo('2026-09-02', MODO_DE_CALENDARIO.SEMANA)).toBe('31 ago – 6 sep 2026');
    expect(tituloDePeriodo('2025-12-31', MODO_DE_CALENDARIO.SEMANA)).toBe(
      '29 dic 2025 – 4 ene 2026',
    );
  });
});

describe('el agrupado', () => {
  it('ubica cada cita en el día de la zona de su clínica', () => {
    // Las 22:00 de Buenos Aires son las 01:00 del día siguiente en UTC: leer el
    // instante con otro reloj movería el turno de casillero.
    const porDia = agruparPorDia([cita('a', '2026-09-05T22:00:00-03:00')]);
    expect([...porDia.keys()]).toEqual(['2026-09-05']);
  });

  it('ordena por hora dentro del día', () => {
    const porDia = agruparPorDia([
      cita('tarde', '2026-09-05T16:00:00-03:00'),
      cita('temprano', '2026-09-05T09:00:00-03:00'),
    ]);
    expect(porDia.get('2026-09-05')?.map((f) => f.cita.id)).toEqual(['temprano', 'tarde']);
  });
});

/**
 * El modo día completa los tres del contrato (Alcance de Plataformas, 3.6). Es
 * una celda y se mueve de a un día: sin eso, "por día" sería la semana con un
 * filtro puesto.
 */
describe('el período de un día', () => {
  it('tiene una sola celda', () => {
    expect(celdasDelPeriodo('2027-01-06', MODO_DE_CALENDARIO.DIA)).toEqual(['2027-01-06']);
  });

  it('se desplaza de a un día y cruza el fin de mes', () => {
    expect(desplazarPeriodo('2027-01-06', MODO_DE_CALENDARIO.DIA, 1)).toBe('2027-01-07');
    expect(desplazarPeriodo('2027-01-01', MODO_DE_CALENDARIO.DIA, -1)).toBe('2026-12-31');
  });

  it('pide a la API solo ese día, no la semana que lo contiene', () => {
    const { desde, hasta } = rangoDelPeriodo('2027-01-06', MODO_DE_CALENDARIO.DIA, 'UTC');

    expect(desde).toBe('2027-01-06T00:00:00.000Z');
    expect(hasta).toBe('2027-01-07T00:00:00.000Z');
  });
});
