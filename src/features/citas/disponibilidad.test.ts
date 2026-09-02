import type { Ausencia } from '../../api/ausencia';
import type { CitaConPaciente } from '../../api/cita';

import { calcularDisponibilidad, motivoDeNoDisponible } from './disponibilidad';

/**
 * Espeja las dos reglas que el backend aplica al asignar (regla 2.2): un
 * profesional no se duplica en el mismo momento, y no se le asigna un turno a
 * quien tiene una ausencia cargada.
 */
function cita(id: string, veterinarioId: string | null, momento: string): CitaConPaciente {
  return {
    cita: {
      id,
      paciente_id: 'p-1',
      clinica_id: 'c-1',
      tipo: 'control',
      fecha_programada: momento,
      veterinario_id: veterinarioId,
      estado: 'pendiente',
      notificar_tutor: false,
      created_at: '',
      updated_at: '',
    },
    paciente_nombre: 'Luna',
    paciente_especie: 'felino',
    veterinario_nombre: null,
    zona_horaria: 'America/Argentina/Buenos_Aires',
  } as CitaConPaciente;
}

function ausencia(veterinarioId: string, desde: string, hasta: string): Ausencia {
  return {
    id: `a-${veterinarioId}`,
    veterinario_id: veterinarioId,
    desde,
    hasta,
    created_at: '',
    updated_at: '',
  };
}

const TURNO = '2027-01-04T13:00:00.000Z';

describe('calcularDisponibilidad', () => {
  it('marca ocupado a quien ya tiene una cita en ese mismo momento', () => {
    const { ocupados } = calcularDisponibilidad({
      momento: TURNO,
      citas: [cita('c-1', 'v-1', TURNO)],
      ausencias: [],
    });

    expect([...ocupados]).toEqual(['v-1']);
  });

  it('no cuenta una cita de otra hora', () => {
    const { ocupados } = calcularDisponibilidad({
      momento: TURNO,
      citas: [cita('c-1', 'v-1', '2027-01-04T14:00:00.000Z')],
      ausencias: [],
    });

    expect(ocupados.size).toBe(0);
  });

  it('no cuenta las citas sin profesional: sin asignar no ocupa a nadie', () => {
    const { ocupados } = calcularDisponibilidad({
      momento: TURNO,
      citas: [cita('c-1', null, TURNO)],
      ausencias: [],
    });

    expect(ocupados.size).toBe(0);
  });

  /** Guardar de nuevo sin mover la hora no puede leerse como un solape consigo misma. */
  it('excluye la propia cita que se está moviendo', () => {
    const { ocupados } = calcularDisponibilidad({
      momento: TURNO,
      citas: [cita('c-1', 'v-1', TURNO)],
      ausencias: [],
      exceptoCitaId: 'c-1',
    });

    expect(ocupados.size).toBe(0);
  });

  it('marca ausente a quien tiene una ausencia que cubre el turno', () => {
    const { ausentes } = calcularDisponibilidad({
      momento: TURNO,
      citas: [],
      ausencias: [ausencia('v-1', '2027-01-04T12:00:00.000Z', '2027-01-04T18:00:00.000Z')],
    });

    expect([...ausentes]).toEqual(['v-1']);
  });

  it('trata el fin de la ausencia como exclusivo', () => {
    const { ausentes } = calcularDisponibilidad({
      momento: TURNO,
      citas: [],
      // Termina justo cuando empieza el turno: no lo tapa.
      ausencias: [ausencia('v-1', '2027-01-04T09:00:00.000Z', TURNO)],
    });

    expect(ausentes.size).toBe(0);
  });

  it('sin turno elegido no hay contra qué medir', () => {
    const { ocupados, ausentes } = calcularDisponibilidad({
      momento: null,
      citas: [cita('c-1', 'v-1', TURNO)],
      ausencias: [ausencia('v-2', '2027-01-04T00:00:00.000Z', '2027-01-05T00:00:00.000Z')],
    });

    expect(ocupados.size).toBe(0);
    expect(ausentes.size).toBe(0);
  });
});

describe('motivoDeNoDisponible', () => {
  it('la ausencia gana sobre el solape', () => {
    const disponibilidad = calcularDisponibilidad({
      momento: TURNO,
      citas: [cita('c-1', 'v-1', TURNO)],
      ausencias: [ausencia('v-1', '2027-01-04T00:00:00.000Z', '2027-01-05T00:00:00.000Z')],
    });

    // Si no va a estar, que tenga otra cita a esa hora es una consecuencia y no
    // el motivo por el que no se lo puede asignar.
    expect(motivoDeNoDisponible('v-1', disponibilidad)).toBe('ausente ese día');
  });

  it('no devuelve motivo cuando está disponible', () => {
    const disponibilidad = calcularDisponibilidad({ momento: TURNO, citas: [], ausencias: [] });

    expect(motivoDeNoDisponible('v-1', disponibilidad)).toBeUndefined();
  });
});
