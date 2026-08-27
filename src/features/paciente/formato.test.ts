import { instanteEnLaClinica } from '../../lib/zona';

import {
  aIso,
  capitalizar,
  desdeIso,
  diaDeInstante,
  diaDeSemanaCorto,
  edad,
  edadCompacta,
  fechaConDiaDeSemana,
  fechaCorta,
  horaCorta,
  microchip,
  peso,
  tamanoDeArchivo,
} from './formato';

describe('fechas de calendario', () => {
  it('no corre el día al interpretar un ISO sin zona', () => {
    // `new Date('2026-08-27')` lo lee como UTC y en Argentina devuelve el 26.
    const fecha = desdeIso('2026-08-27');

    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth()).toBe(7);
    expect(fecha.getDate()).toBe(27);
  });

  it('va y vuelve entre Date e ISO', () => {
    expect(aIso(desdeIso('2026-01-05'))).toBe('2026-01-05');
  });

  it('escribe la fecha como se lee en una historia clínica', () => {
    expect(fechaCorta('2026-08-27')).toBe('27 ago 2026');
    expect(fechaCorta('2026-01-01')).toBe('1 ene 2026');
  });

  it('nombra el día de la semana', () => {
    const casos: [string, string][] = [
      ['2026-08-30', 'dom'],
      ['2026-08-31', 'lun'],
      ['2026-09-01', 'mar'],
      ['2026-09-02', 'mié'],
      ['2026-09-03', 'jue'],
      ['2026-09-04', 'vie'],
      ['2026-09-05', 'sáb'],
    ];

    for (const [iso, esperado] of casos) {
      expect(diaDeSemanaCorto(iso)).toBe(esperado);
    }
    expect(fechaConDiaDeSemana('2026-08-31')).toBe('lun 31 ago 2026');
  });
});

describe('instantes con zona', () => {
  it('agrupa por el día de la clínica y no por el de UTC', () => {
    // 21:00 en Buenos Aires ya es el día siguiente en UTC: cortar el ISO por los
    // primeros diez caracteres movería el turno de día.
    const turnoDeNoche = instanteEnLaClinica('2026-08-27', 21 * 60).toISOString();

    expect(diaDeInstante(turnoDeNoche)).toBe('2026-08-27');
  });

  it('agrupa por el día de la clínica y no por el del dispositivo', () => {
    // La suite corre en Tokio, 12 horas adelante: un turno de la mañana en la
    // clínica cae al día siguiente si se lo lee con el reloj local.
    const turnoTemprano = instanteEnLaClinica('2026-08-27', 9 * 60).toISOString();

    expect(diaDeInstante(turnoTemprano)).toBe('2026-08-27');
  });

  it('muestra la hora que marca el reloj de la clínica', () => {
    expect(horaCorta(instanteEnLaClinica('2026-08-27', 9 * 60 + 5).toISOString())).toBe('09:05');
  });
});

describe('edad', () => {
  const hoy = new Date(2026, 7, 27);

  it('cuenta años y meses cumplidos', () => {
    expect(edad('2022-05-14', hoy)).toBe('4 años 3 meses');
    expect(edadCompacta('2022-05-14', hoy)).toBe('4 a 3 m');
  });

  it('omite los años cuando todavía no cumplió uno', () => {
    expect(edad('2026-06-27', hoy)).toBe('2 meses');
    expect(edad('2026-07-27', hoy)).toBe('1 mes');
  });

  it('no cuenta el mes que todavía no se cumplió', () => {
    // Nació un 28: el 27 del mes siguiente todavía no cumplió el mes.
    expect(edad('2026-07-28', hoy)).toBe('0 meses');
  });

  it('omite los meses en un cumpleaños redondo', () => {
    expect(edad('2020-08-27', hoy)).toBe('6 años');
  });
});

describe('peso', () => {
  it('se muestra al gramo y con coma', () => {
    expect(peso(8.432)).toBe('8,432 kg');
    expect(peso(12)).toBe('12,000 kg');
  });
});

describe('microchip', () => {
  it('se agrupa de a tres para poder leerlo', () => {
    expect(microchip('941000024871903')).toBe('941 000 024 871 903');
  });

  it('devuelve null cuando no está cargado', () => {
    expect(microchip(null)).toBeNull();
    expect(microchip(undefined)).toBeNull();
    expect(microchip('')).toBeNull();
  });
});

describe('formato auxiliar', () => {
  it('escribe el tamaño de archivo en la unidad que corresponde', () => {
    expect(tamanoDeArchivo(512)).toBe('512 B');
    expect(tamanoDeArchivo(2048)).toBe('2 KB');
    expect(tamanoDeArchivo(3 * 1024 * 1024)).toBe('3,0 MB');
  });

  it('capitaliza sin romperse con la cadena vacía', () => {
    expect(capitalizar('canino')).toBe('Canino');
    expect(capitalizar('')).toBe('');
  });
});
