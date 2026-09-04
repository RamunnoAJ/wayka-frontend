// En @testing-library/react-native v14 tanto `render` como `fireEvent` son
// asíncronos: sin esperarlos, la aserción corre sobre el árbol anterior.
import { render } from '../../pruebas/render';

import { FormularioDeAusencia } from './FormularioDeAusencia';

jest.mock('./queries', () => ({
  useCrearAusencia: () => ({ mutate: jest.fn(), isPending: false, isError: false }),
  usePrevisualizacionDeAusencia: (entrada: unknown) => mockPrevisualizacion(entrada),
}));

let mockPrevisualizacion: (entrada: unknown) => {
  data?: { citas_afectadas: number; horarios: string[] };
  isError: boolean;
  refetch: () => void;
};

/**
 * Lo que se prueba acá es la garantía del contrato, no el layout: **antes de
 * guardar, la pantalla dice cuántas citas caen adentro del rango y cuáles son**
 * (Alcance de Plataformas, 3.2.3; Reglas de Negocio, 4.22 paso 2).
 *
 * Importa que salga sola. El efecto no se deshace —dar de baja la ausencia no
 * devuelve las citas—, así que un aviso detrás de un botón opcional deja el
 * camino corto sin informar.
 */
function propsBase() {
  return {
    veterinarioId: '7e000000-0000-0000-0000-000000000002',
    nombre: 'Lucia Ferreyra',
    zonaHoraria: 'America/Argentina/Buenos_Aires',
    onCerrar: jest.fn(),
  };
}

const CON_DOS_CITAS = {
  data: {
    citas_afectadas: 2,
    horarios: ['2026-09-04T09:30:00-03:00', '2026-09-04T11:00:00-03:00'],
  },
  isError: false,
  refetch: jest.fn(),
};

describe('FormularioDeAusencia', () => {
  beforeEach(() => {
    mockPrevisualizacion = () => CON_DOS_CITAS;
  });

  it('dice el efecto sin que haya que pedirlo', async () => {
    const { getByText, queryByText } = await render(<FormularioDeAusencia {...propsBase()} />);

    expect(getByText('2 citas van a quedar sin profesional.')).toBeOnTheScreen();
    // El aviso no cuelga de un botón: enterarse después de guardar no sirve.
    expect(queryByText('Ver qué citas afecta')).toBeNull();
  });

  it('dice cuáles son, y no solo cuántas', async () => {
    const { getByText } = await render(<FormularioDeAusencia {...propsBase()} />);

    expect(getByText('vie 4 sep 2026 · 09:30')).toBeOnTheScreen();
    expect(getByText('vie 4 sep 2026 · 11:00')).toBeOnTheScreen();
  });

  it('concuerda el singular cuando cae una sola cita', async () => {
    mockPrevisualizacion = () => ({
      data: { citas_afectadas: 1, horarios: ['2026-09-04T09:30:00-03:00'] },
      isError: false,
      refetch: jest.fn(),
    });

    const { getByText } = await render(<FormularioDeAusencia {...propsBase()} />);

    expect(getByText('1 cita va a quedar sin profesional.')).toBeOnTheScreen();
  });

  it('no consulta mientras el rango no cierra', async () => {
    const recibido: unknown[] = [];
    mockPrevisualizacion = (entrada) => {
      recibido.push(entrada);
      return { data: undefined, isError: false, refetch: jest.fn() };
    };

    // El rango que trae por defecto sí cierra (09:00 a 20:00 del mismo día);
    // lo que se comprueba es que la consulta salga apagada hasta que el rango
    // deje de moverse, que es lo que devuelve `useRangoDemorado` al montar.
    await render(<FormularioDeAusencia {...propsBase()} />);

    expect(recibido[0]).toBeNull();
  });
});
