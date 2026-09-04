// En @testing-library/react-native v14 tanto `render` como `fireEvent` son
// asíncronos: sin esperarlos, la aserción corre sobre el árbol anterior.
import { fireEvent } from '@testing-library/react-native';

import type { Grilla, PrevisualizacionDeGrilla } from '../../api/clinica';
import { render } from '../../pruebas/render';

import { EditorDeHorario } from './EditorDeHorario';

jest.mock('./queries', () => ({
  useGrilla: () => ({ data: mockGrilla(), isPending: false, isError: false }),
  useEscribirGrilla: () => ({ mutate: jest.fn(), isPending: false, isError: false }),
  useActualizarClinica: () => ({ mutate: jest.fn(), isPending: false, isError: false }),
  usePrevisualizarGrilla: () => mockPrevisualizar(),
}));

/**
 * Lo que se prueba acá es la regla, no el layout: **la pantalla dice cuáles son
 * las citas que quedarían sin turno, antes del intento** (Alcance de
 * Plataformas, 3.2.4). Con el conteo solo hay que corregir la grilla a ciegas
 * hasta que el guardado deje de fallar, que es lo que la regla prohíbe.
 */
const GRILLA: Grilla = {
  franjas: [0, 1, 2, 3, 4].map((dia) => ({
    dia_semana: dia as 0,
    hora_desde: '09:00',
    hora_hasta: '18:00',
  })),
  duracion_turno_minutos: 30,
  zona_horaria: 'America/Argentina/Buenos_Aires',
};

const mockGrilla = () => GRILLA;

let mockPrevisualizar: () => {
  data?: PrevisualizacionDeGrilla;
  isPending: boolean;
  isError: boolean;
  mutate: jest.Mock;
  reset: jest.Mock;
  error?: Error;
};

function previsualizacion(afuera: string[]): PrevisualizacionDeGrilla {
  return {
    turnos_por_dia: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({
      dia_semana: dia as 0,
      turnos: dia < 5 ? 18 : 0,
    })),
    citas_que_quedan_afuera: afuera,
  };
}

function conEfecto(data: PrevisualizacionDeGrilla) {
  return { data, isPending: false, isError: false, mutate: jest.fn(), reset: jest.fn() };
}

describe('EditorDeHorario y el efecto de la grilla', () => {
  it('dice cuáles son las citas que quedarían afuera, no solo cuántas', async () => {
    mockPrevisualizar = () =>
      conEfecto(
        previsualizacion([
          '2026-09-07T09:00:00-03:00',
          '2026-09-08T16:30:00-03:00',
          '2026-09-10T11:30:00-03:00',
        ]),
      );

    const { getByText } = await render(<EditorDeHorario clinicaId="c1" />);

    expect(getByText('3 citas pendientes quedarían sin turno donde existir')).toBeOnTheScreen();
    expect(getByText('lun 7 sep 2026 · 09:00')).toBeOnTheScreen();
    expect(getByText('mar 8 sep 2026 · 16:30')).toBeOnTheScreen();
    expect(getByText('jue 10 sep 2026 · 11:30')).toBeOnTheScreen();
  });

  // Dos mascotas distintas pueden tener turno a la misma hora: la agenda es de
  // la clínica, no de cada profesional.
  it('lista dos citas del mismo instante como dos', async () => {
    mockPrevisualizar = () =>
      conEfecto(previsualizacion(['2026-09-04T16:00:00-03:00', '2026-09-04T16:00:00-03:00']));

    const { getAllByText, getByText } = await render(<EditorDeHorario clinicaId="c1" />);

    expect(getByText('2 citas pendientes quedarían sin turno donde existir')).toBeOnTheScreen();
    expect(getAllByText('vie 4 sep 2026 · 16:00')).toHaveLength(2);
  });

  it('concuerda el singular cuando queda una sola', async () => {
    mockPrevisualizar = () => conEfecto(previsualizacion(['2026-09-07T09:00:00-03:00']));

    const { getByText } = await render(<EditorDeHorario clinicaId="c1" />);

    expect(getByText('1 cita pendiente quedaría sin turno donde existir')).toBeOnTheScreen();
  });

  it('no inventa una lista cuando no queda ninguna afuera', async () => {
    mockPrevisualizar = () => conEfecto(previsualizacion([]));

    const { getByText } = await render(<EditorDeHorario clinicaId="c1" />);

    expect(
      getByText('No hay ninguna cita pendiente que quede fuera de la grilla.'),
    ).toBeOnTheScreen();
  });

  it('el efecto se pide antes de guardar, no como el texto de un error', async () => {
    const mutate = jest.fn();
    mockPrevisualizar = () => ({
      data: undefined,
      isPending: false,
      isError: false,
      mutate,
      reset: jest.fn(),
    });

    const { getByText } = await render(<EditorDeHorario clinicaId="c1" />);
    await fireEvent.press(getByText('Ver el efecto'));

    expect(mutate).toHaveBeenCalledWith({ franjas: GRILLA.franjas });
  });
});
