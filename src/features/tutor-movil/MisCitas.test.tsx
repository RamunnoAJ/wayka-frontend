// En @testing-library/react-native v14 tanto `render` como `fireEvent` son
// asíncronos: sin esperarlos, la aserción corre sobre el árbol anterior.
import { fireEvent } from '@testing-library/react-native';

import type { CitaConPaciente } from '../../api/cita';
import { render } from '../../pruebas/render';

import { MisCitas } from './MisCitas';
import { useMiAgenda } from './queries';

jest.mock('./queries', () => ({ useMiAgenda: jest.fn() }));
jest.mock('../sincronizacion', () => ({
  useEstadosPorRegistro: () => ({ data: new Map() }),
}));

const useMiAgendaMock = useMiAgenda as jest.MockedFunction<typeof useMiAgenda>;

/** Lo que la pantalla mira del resultado de la consulta, y nada más. */
function agendaCargada(data: CitaConPaciente[]) {
  return { isPending: false, isError: false, data } as unknown as ReturnType<typeof useMiAgenda>;
}

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
  zona_horaria: 'America/Argentina/Buenos_Aires',
} as CitaConPaciente;

/**
 * Lo que se prueba es que ninguna cita del período se esconda: la grilla sola no
 * dice qué es cada punto, así que lo que la pantalla no puede hacer es pedir un
 * toque para enterarse de que hay algo.
 */
describe('MisCitas', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T12:00:00-03:00'));
    useMiAgendaMock.mockReturnValue(agendaCargada([CITA]));
  });

  afterEach(() => jest.useRealTimers());

  it('abre en la semana con sus citas debajo de la grilla', async () => {
    const { getByRole, getByText } = await render(<MisCitas />);

    expect(getByText('31 ago – 6 sep 2026')).toBeTruthy();
    // Sin tocar nada: la cita del 2 está en la semana que se abre.
    expect(getByText('mié 2 sep 2026')).toBeTruthy();
    expect(getByText('Control · Frida')).toBeTruthy();

    await fireEvent.press(getByRole('tab', { name: 'Mes' }));
    expect(getByText('septiembre 2026')).toBeTruthy();
    expect(getByText('Control · Frida')).toBeTruthy();
  });

  it('acota a un día al tocarlo y lo suelta al volver a tocarlo', async () => {
    const { getByRole, getByText, queryByText } = await render(<MisCitas />);

    await fireEvent.press(getByRole('button', { name: 'mar 1 sep 2026, sin citas' }));
    expect(getByText('No hay citas este día.')).toBeTruthy();
    expect(queryByText('Control · Frida')).toBeNull();

    await fireEvent.press(getByRole('button', { name: 'mar 1 sep 2026, sin citas' }));
    expect(getByText('Control · Frida')).toBeTruthy();
  });

  it('al cambiar de período suelta el día que ya no se ve', async () => {
    const { getByRole, getByText } = await render(<MisCitas />);

    await fireEvent.press(getByRole('button', { name: 'mar 1 sep 2026, sin citas' }));
    await fireEvent.press(getByRole('button', { name: 'Semana siguiente' }));

    // El 1 quedó fuera de la grilla: lo que se muestra ya es la semana entera,
    // aunque esta no tenga nada.
    expect(getByText('7 – 13 sep 2026')).toBeTruthy();
    expect(getByText('No hay citas esta semana.')).toBeTruthy();
  });

  it('sin citas no ofrece vistas que estarían vacías', async () => {
    useMiAgendaMock.mockReturnValue(agendaCargada([]));

    const { queryByRole, getByText } = await render(<MisCitas />);

    expect(getByText('No tenés citas agendadas')).toBeTruthy();
    expect(queryByRole('tab', { name: 'Mes' })).toBeNull();
  });
});
