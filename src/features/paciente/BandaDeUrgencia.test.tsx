import { render } from '../../pruebas/render';

import { BandaDeUrgencia } from './BandaDeUrgencia';
import type { DatosCriticos } from './queries';

/**
 * La banda existe para leerse en segundos durante una urgencia, y su propio
 * contrato dice que **nunca desaparece cuando está vacía**: "la ausencia de dato
 * es información clínica, y un hueco no se distingue de un dato que no llegó a
 * cargarse".
 *
 * Justamente por eso no puede afirmar la ausencia cuando el dato **no llegó**.
 * "Sin alergias registradas" sobre un paciente cuyas consultas fallaron es un
 * falso negativo clínico en el bloque donde más caro sale.
 */
const VACIOS: DatosCriticos = {
  alergias: [],
  haySevera: false,
  activas: [],
  historicas: [],
  ultimaVacuna: null,
  proximaDosis: null,
};

function props(sobrescribir: Partial<Parameters<typeof BandaDeUrgencia>[0]> = {}) {
  return {
    datos: VACIOS,
    esMovil: false,
    cargando: false,
    error: false,
    onVerMedicacion: () => {},
    ...sobrescribir,
  };
}

describe('la banda de datos críticos', () => {
  it('afirma la ausencia solo cuando los datos llegaron', async () => {
    const { getByText } = await render(<BandaDeUrgencia {...props()} />);

    expect(
      getByText('sin alergias registradas · sin medicación activa · sin vacunas registradas'),
    ).toBeOnTheScreen();
  });

  it('no afirma nada mientras los datos están cargando', async () => {
    const { queryByText } = await render(<BandaDeUrgencia {...props({ cargando: true })} />);

    expect(queryByText(/sin alergias registradas/)).toBeNull();
    expect(queryByText(/sin medicación activa/)).toBeNull();
    expect(queryByText(/sin vacunas registradas/)).toBeNull();
  });

  it('dice que no pudo leerlos cuando la consulta falló, en vez de decir que no hay', async () => {
    const { getByText, queryByText } = await render(
      <BandaDeUrgencia {...props({ error: true })} />,
    );

    expect(queryByText(/sin alergias registradas/)).toBeNull();
    expect(getByText(/No se pudieron leer/)).toBeOnTheScreen();
  });
});
