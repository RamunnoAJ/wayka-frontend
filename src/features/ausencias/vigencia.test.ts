import type { Ausencia } from '../../api/ausencia';

import { estaAusenteAhora } from './vigencia';

/**
 * "Quién falta hoy" es la mirada transversal que la fila del plantel responde:
 * la lista completa de cada persona vive en su ficha, pero abrir ocho fichas
 * para saber quién no está no es una respuesta.
 */
function ausencia(veterinarioId: string, desde: string, hasta: string): Ausencia {
  return {
    id: `${veterinarioId}-${desde}`,
    veterinario_id: veterinarioId,
    desde,
    hasta,
    created_at: '',
    updated_at: '',
  };
}

const AHORA = new Date('2027-01-06T13:00:00.000Z');

describe('estaAusenteAhora', () => {
  it('marca a quien tiene una ausencia que cubre este momento', () => {
    const vigentes = estaAusenteAhora(
      [ausencia('v-1', '2027-01-06T09:00:00.000Z', '2027-01-06T18:00:00.000Z')],
      AHORA,
    );

    expect(vigentes.get('v-1')?.hasta.toISOString()).toBe('2027-01-06T18:00:00.000Z');
  });

  it('no marca la que ya terminó ni la que todavía no empezó', () => {
    const vigentes = estaAusenteAhora(
      [
        ausencia('v-1', '2027-01-05T09:00:00.000Z', '2027-01-05T18:00:00.000Z'),
        ausencia('v-2', '2027-01-07T09:00:00.000Z', '2027-01-07T18:00:00.000Z'),
      ],
      AHORA,
    );

    expect(vigentes.size).toBe(0);
  });

  it('trata el fin como exclusivo', () => {
    const vigentes = estaAusenteAhora(
      [ausencia('v-1', '2027-01-06T09:00:00.000Z', AHORA.toISOString())],
      AHORA,
    );

    expect(vigentes.size).toBe(0);
  });

  it('con dos solapadas se queda con la que termina más tarde', () => {
    // Lo que la fila responde es "hasta cuándo no está": la más corta daría una
    // fecha que ya pasó.
    const vigentes = estaAusenteAhora(
      [
        ausencia('v-1', '2027-01-06T09:00:00.000Z', '2027-01-06T14:00:00.000Z'),
        ausencia('v-1', '2027-01-06T10:00:00.000Z', '2027-01-09T14:00:00.000Z'),
      ],
      AHORA,
    );

    expect(vigentes.get('v-1')?.hasta.toISOString()).toBe('2027-01-09T14:00:00.000Z');
  });
});
