import type { Clinica } from '../../api/clinica';

import { horaDeMinutos, minutosDeHora, turnosDelDia } from './grilla';

/**
 * La grilla replica la cuenta que el backend hace en `validarContraLaGrilla`.
 * Si estos tests y los de `internal/negocio/cita_test.go` dejan de coincidir, es
 * la interfaz la que está ofreciendo horas que la API va a rechazar.
 */
const CLINICA: Clinica = {
  id: 'c1',
  nombre: 'Veterinaria Norte',
  direccion: 'Av. Siempre Viva 123',
  contacto: '011-1234-5678',
  hora_apertura: '09:00',
  hora_cierre: '18:00',
  duracion_turno_minutos: 30,
  created_at: '',
  updated_at: '',
};

// Medianoche del día que se pide: así ningún turno quedó atrás y `disponible`
// no depende de cuándo corra la suite.
const MEDIANOCHE = new Date(2027, 0, 1, 0, 0, 0);

describe('turnosDelDia', () => {
  it('cubre el horario de atención de punta a punta', () => {
    const turnos = turnosDelDia(CLINICA, '2027-01-01', MEDIANOCHE);

    expect(turnos).toHaveLength(18);
    expect(turnos[0]?.etiqueta).toBe('09:00');
    expect(turnos.at(-1)?.etiqueta).toBe('17:30');
  });

  it('no ofrece el turno que terminaría después del cierre', () => {
    const turnos = turnosDelDia(CLINICA, '2027-01-01', MEDIANOCHE);

    // Las 18:00 son la hora de cierre: un turno que arranca ahí termina afuera.
    expect(turnos.map((turno) => turno.etiqueta)).not.toContain('18:00');
  });

  it('sigue la duración de turno de la clínica, no una fija', () => {
    const cada45 = { ...CLINICA, hora_apertura: '07:00', duracion_turno_minutos: 45 };

    const turnos = turnosDelDia(cada45, '2027-01-01', MEDIANOCHE);

    // De 07:00 a 18:00 hay 660 minutos: entran 14 turnos de 45 y sobran 30.
    expect(turnos).toHaveLength(14);
    expect(turnos[1]?.etiqueta).toBe('07:45');
  });

  it('marca los turnos que ya pasaron en vez de esconderlos', () => {
    const aLasTres = new Date(2027, 0, 1, 15, 0, 0);

    const turnos = turnosDelDia(CLINICA, '2027-01-01', aLasTres);

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

  it('no arma grilla con un horario que no cierra', () => {
    const casos: Partial<Clinica>[] = [
      { hora_cierre: '08:00' },
      { hora_cierre: '09:00' },
      { duracion_turno_minutos: 0 },
    ];

    for (const caso of casos) {
      expect(turnosDelDia({ ...CLINICA, ...caso }, '2027-01-01', MEDIANOCHE)).toEqual([]);
    }
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
