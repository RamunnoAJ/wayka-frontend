// En @testing-library/react-native v14 tanto `render` como `fireEvent` son
// asíncronos: sin esperarlos, la aserción corre sobre el árbol anterior.
import { fireEvent } from '@testing-library/react-native';

import type { CitaConPaciente } from '../../api/cita';
import { render } from '../../pruebas/render';

import { AgendaDeLaClinica } from './AgendaDeLaClinica';
import { useAgenda } from './queries';

jest.mock('./queries', () => ({ useAgenda: jest.fn() }));
jest.mock('../consultas', () => ({ useAsentarAtencion: () => mockAsentar() }));
jest.mock('../veterinario/queries', () => ({ usePlantel: () => ({ data: [] }) }));
jest.mock('../../hooks/useSesion', () => ({ useSesion: () => mockSesion() }));

const asentar = jest.fn();
const mockAsentar = () => ({ mutate: asentar, isPending: false, isError: false });

/** La ficha de veterinario de quien mira; un clínica_admin no tiene. */
let mockSesion: () => {
  sesion: { usuario: { veterinario_id: string | null; tipo_usuario: string } } | null;
};

const useAgendaMock = useAgenda as jest.MockedFunction<typeof useAgenda>;

const CITA = {
  cita: {
    id: 'c1',
    paciente_id: 'p1',
    tipo: 'control',
    fecha_programada: '2026-09-02T14:30:00-03:00',
    estado: 'pendiente',
    notificar_tutor: true,
    created_at: '2026-08-01T10:00:00-03:00',
    updated_at: '2026-08-01T10:00:00-03:00',
  },
  paciente_nombre: 'Frida',
  veterinario_nombre: 'Dra. Paz',
  zona_horaria: 'America/Argentina/Buenos_Aires',
} as CitaConPaciente;

function agendaCargada(data: CitaConPaciente[]) {
  return { isPending: false, isError: false, data } as unknown as ReturnType<typeof useAgenda>;
}

/**
 * Lo que se prueba es que el período que se ve y el que se pide sean el mismo:
 * una grilla que muestre una semana y consulte otra deja turnos afuera sin que
 * nada lo diga.
 */
describe('AgendaDeLaClinica', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T12:00:00-03:00'));
    useAgendaMock.mockReturnValue(agendaCargada([CITA]));
    mockSesion = () => ({
      sesion: { usuario: { veterinario_id: 'vet-1', tipo_usuario: 'veterinario' } },
    });
  });

  afterEach(() => jest.useRealTimers());

  it('consulta la semana que está mostrando y muestra sus citas', async () => {
    const { getByText } = await render(<AgendaDeLaClinica onAbrirPaciente={jest.fn()} />);

    expect(getByText('31 ago – 6 sep 2026')).toBeTruthy();
    expect(useAgendaMock).toHaveBeenLastCalledWith({
      desde: '2026-08-31T03:00:00.000Z',
      hasta: '2026-09-07T03:00:00.000Z',
      // Abre en las citas de quien mira, sin que haya que elegirlo.
      veterinario_id: 'vet-1',
      limite: 200,
    });
    expect(getByText('Frida')).toBeTruthy();
    expect(getByText('Control · Dra. Paz')).toBeTruthy();
  });

  it('vuelve a preguntar al moverse de semana', async () => {
    const { getByRole } = await render(<AgendaDeLaClinica onAbrirPaciente={jest.fn()} />);

    await fireEvent.press(getByRole('button', { name: 'Semana siguiente' }));

    expect(useAgendaMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        desde: '2026-09-07T03:00:00.000Z',
        hasta: '2026-09-14T03:00:00.000Z',
      }),
    );
  });

  it('el mes pide todas las casillas de la grilla, no solo el mes', async () => {
    const { getByRole } = await render(<AgendaDeLaClinica onAbrirPaciente={jest.fn()} />);

    await fireEvent.press(getByRole('tab', { name: 'Mes' }));

    expect(useAgendaMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        desde: '2026-08-31T03:00:00.000Z',
        hasta: '2026-10-05T03:00:00.000Z',
      }),
    );
  });

  it('deja pasar a toda la clínica desde el selector', async () => {
    const { getByText } = await render(<AgendaDeLaClinica onAbrirPaciente={jest.fn()} />);

    expect(getByText('Mis citas')).toBeTruthy();
    await fireEvent.press(getByText('Mis citas'));
    await fireEvent.press(getByText('Toda la clínica'));

    expect(useAgendaMock).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ veterinario_id: expect.anything() }),
    );
  });

  it('quien no atiende abre en toda la clínica y no tiene "Mis citas"', async () => {
    mockSesion = () => ({
      sesion: { usuario: { veterinario_id: null, tipo_usuario: 'clinica_admin' } },
    });

    const { queryByText } = await render(<AgendaDeLaClinica onAbrirPaciente={jest.fn()} />);

    expect(queryByText('Mis citas')).toBeNull();
    expect(useAgendaMock).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ veterinario_id: expect.anything() }),
    );
  });

  /**
   * Asentar la atención es afirmación asistencial y la hace quien atendió: el
   * clínica_admin lee la agenda y la reparte, no la cierra (Reglas de Negocio,
   * 3.2). El backend lo rechaza igual; ofrecer el botón sería prometerlo.
   */
  it('no le ofrece asentar la atención al clínica_admin', async () => {
    mockSesion = () => ({
      sesion: { usuario: { veterinario_id: null, tipo_usuario: 'clinica_admin' } },
    });

    const { queryByLabelText, getByLabelText } = await render(<AgendaDeLaClinica />);

    expect(queryByLabelText('Asentar que se atendió a Frida')).toBeNull();
    // Repartir sí: es la tarea que el tablero ya señalaba sin dejar hacer.
    expect(getByLabelText('Acciones de la cita de Frida')).toBeOnTheScreen();
  });

  /**
   * Sin handler la fila no lleva a ningún lado: el admin no alcanza la ficha del
   * paciente, y un toque que termina en 403 es peor que ninguno.
   */
  it('sin onAbrirPaciente la fila no navega', async () => {
    mockSesion = () => ({
      sesion: { usuario: { veterinario_id: null, tipo_usuario: 'clinica_admin' } },
    });

    const { getByText } = await render(<AgendaDeLaClinica />);

    // La fila sigue mostrando los datos, solo que no es un control.
    expect(getByText('Frida')).toBeOnTheScreen();
  });

  it('busca por mascota dentro del período, sin volver a la red', async () => {
    const { getByLabelText, getByText, queryByText } = await render(
      <AgendaDeLaClinica onAbrirPaciente={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Buscar mascota'), 'noño');
    expect(queryByText('Frida')).toBeNull();
    expect(getByText('No hay citas esta semana.')).toBeTruthy();
    // La consulta es la misma: lo que cambió es qué se muestra de lo que ya vino.
    expect(useAgendaMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ desde: '2026-08-31T03:00:00.000Z' }),
    );

    await fireEvent.changeText(getByLabelText('Buscar mascota'), 'FRI');
    expect(getByText('Frida')).toBeTruthy();
  });
});

describe('asentar la atención desde la agenda', () => {
  it('asienta la cita como atendida, que es lo que la cumple', async () => {
    useAgendaMock.mockReturnValue(agendaCargada([CITA]));

    const pantalla = await render(<AgendaDeLaClinica onAbrirPaciente={jest.fn()} />);
    await fireEvent.press(pantalla.getByLabelText('Asentar que se atendió a Frida'));

    expect(asentar).toHaveBeenCalledWith({ origen: 'agendada', cita_id: 'c1' });
  });

  it('no lo ofrece sobre una cita que ya se atendió', async () => {
    useAgendaMock.mockReturnValue(
      agendaCargada([{ ...CITA, cita: { ...CITA.cita, estado: 'cumplido' } } as CitaConPaciente]),
    );

    const pantalla = await render(<AgendaDeLaClinica onAbrirPaciente={jest.fn()} />);

    expect(pantalla.queryByLabelText('Asentar que se atendió a Frida')).toBeNull();
  });
});
