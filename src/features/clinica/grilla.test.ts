import type { Grilla } from '../../api/clinica';
import { instanteEnLaClinica } from '../../lib/zona';

import { diaDeLaSemanaDe, horaDeMinutos, minutosDeHora, turnosDelDia } from './grilla';

/**
 * La grilla replica la cuenta que el backend hace en `Grilla.Admite`. Si estos
 * tests y los de `internal/negocio/franja_test.go` dejan de coincidir, es la
 * interfaz la que está ofreciendo horas que la API va a rechazar.
 */
const TODA_LA_SEMANA: Grilla = {
  franjas: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
    dia_semana: dia as 0,
    hora_desde: '09:00',
    hora_hasta: '18:00',
  })),
  duracion_turno_minutos: 30,
  zona_horaria: 'America/Argentina/Buenos_Aires',
};

// El 1 de enero de 2027 es viernes.
const VIERNES = '2027-01-01';
const SABADO = '2027-01-02';

// Medianoche **en la clínica** del día que se pide: así ningún turno quedó atrás
// y `disponible` no depende ni de cuándo corra la suite ni de en qué zona.
const MEDIANOCHE = instanteEnLaClinica(VIERNES, 0);

describe('turnosDelDia', () => {
  it('cubre el horario de atención de punta a punta', () => {
    const turnos = turnosDelDia(TODA_LA_SEMANA, VIERNES, MEDIANOCHE);

    expect(turnos).toHaveLength(18);
    expect(turnos[0]?.etiqueta).toBe('09:00');
    expect(turnos.at(-1)?.etiqueta).toBe('17:30');
  });

  it('no ofrece el turno que terminaría después del cierre', () => {
    const turnos = turnosDelDia(TODA_LA_SEMANA, VIERNES, MEDIANOCHE);

    // Las 18:00 son la hora de cierre: un turno que arranca ahí termina afuera.
    expect(turnos.map((turno) => turno.etiqueta)).not.toContain('18:00');
  });

  it('sigue la duración de turno de la clínica, no una fija', () => {
    const cada45: Grilla = {
      ...TODA_LA_SEMANA,
      franjas: TODA_LA_SEMANA.franjas.map((franja) => ({ ...franja, hora_desde: '07:00' })),
      duracion_turno_minutos: 45,
    };

    const turnos = turnosDelDia(cada45, VIERNES, MEDIANOCHE);

    // De 07:00 a 18:00 hay 660 minutos: entran 14 turnos de 45 y sobran 30.
    expect(turnos).toHaveLength(14);
    expect(turnos[1]?.etiqueta).toBe('07:45');
  });

  it('marca los turnos que ya pasaron en vez de esconderlos', () => {
    const aLasTres = instanteEnLaClinica(VIERNES, 15 * 60);

    const turnos = turnosDelDia(TODA_LA_SEMANA, VIERNES, aLasTres);

    expect(turnos).toHaveLength(18);
    // El hueco confunde más que el gris: la grilla completa se sigue viendo.
    expect(turnos.filter((turno) => turno.disponible).map((turno) => turno.etiqueta)).toEqual([
      '15:30',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
    ]);
  });

  it('deja el día cerrado sin ningún turno', () => {
    const cierraElSabado: Grilla = {
      ...TODA_LA_SEMANA,
      franjas: TODA_LA_SEMANA.franjas.filter((franja) => franja.dia_semana !== 5),
    };

    expect(turnosDelDia(cierraElSabado, SABADO, MEDIANOCHE)).toEqual([]);
    // Y el resto de la semana sigue como estaba.
    expect(turnosDelDia(cierraElSabado, VIERNES, MEDIANOCHE)).toHaveLength(18);
  });

  it('salta el hueco del corte de mediodía', () => {
    const conCorte: Grilla = {
      franjas: [
        { dia_semana: 4, hora_desde: '09:00', hora_hasta: '13:00' },
        { dia_semana: 4, hora_desde: '16:00', hora_hasta: '20:00' },
      ],
      duracion_turno_minutos: 30,
      zona_horaria: TODA_LA_SEMANA.zona_horaria,
    };

    const etiquetas = turnosDelDia(conCorte, VIERNES, MEDIANOCHE).map((turno) => turno.etiqueta);

    expect(etiquetas).toHaveLength(16);
    expect(etiquetas).toContain('12:30');
    expect(etiquetas).toContain('16:00');
    // El hueco no es una pausa que el turno pueda atravesar: entre las 13:00 y
    // las 16:00 no hay nada que ofrecer.
    expect(etiquetas).not.toContain('13:00');
    expect(etiquetas).not.toContain('14:00');
  });

  it('cuenta la grilla desde el comienzo de cada franja', () => {
    const tardeCorrida: Grilla = {
      franjas: [
        { dia_semana: 4, hora_desde: '09:00', hora_hasta: '13:00' },
        { dia_semana: 4, hora_desde: '15:20', hora_hasta: '17:20' },
      ],
      duracion_turno_minutos: 30,
      zona_horaria: TODA_LA_SEMANA.zona_horaria,
    };

    const etiquetas = turnosDelDia(tardeCorrida, VIERNES, MEDIANOCHE).map(
      (turno) => turno.etiqueta,
    );

    // Una franja de tarde que abre 15:20 tiene su propia grilla, no la que venía
    // contando desde la mañana.
    expect(etiquetas).toContain('15:20');
    expect(etiquetas).toContain('15:50');
    expect(etiquetas).not.toContain('16:00');
  });

  it('no arma grilla con un horario que no cierra', () => {
    const casos: Grilla[] = [
      { ...TODA_LA_SEMANA, duracion_turno_minutos: 0 },
      { ...TODA_LA_SEMANA, franjas: [] },
      {
        ...TODA_LA_SEMANA,
        franjas: [{ dia_semana: 4, hora_desde: '18:00', hora_hasta: '09:00' }],
      },
    ];

    for (const caso of casos) {
      expect(turnosDelDia(caso, VIERNES, MEDIANOCHE)).toEqual([]);
    }
  });
});

describe('diaDeLaSemanaDe', () => {
  it('arranca en lunes y no en domingo', () => {
    // 2027-01-01 es viernes; el 2, sábado; el 3, domingo; el 4, lunes.
    expect(diaDeLaSemanaDe('2027-01-01')).toBe(4);
    expect(diaDeLaSemanaDe('2027-01-02')).toBe(5);
    expect(diaDeLaSemanaDe('2027-01-03')).toBe(6);
    expect(diaDeLaSemanaDe('2027-01-04')).toBe(0);
  });
});

describe('conversión de horas', () => {
  it('va y vuelve entre HH:MM y minutos desde la medianoche', () => {
    const casos: [string, number][] = [
      ['00:00', 0],
      ['09:00', 540],
      ['09:30', 570],
      ['23:59', 1439],
    ];

    for (const [texto, minutos] of casos) {
      expect(minutosDeHora(texto)).toBe(minutos);
      expect(horaDeMinutos(minutos)).toBe(texto);
    }
  });
});
