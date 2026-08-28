import { render } from '../../pruebas/render';

import { MisDatos } from './MisDatos';
import { useMiTutorID } from './queries';

jest.mock('./queries', () => ({ useMiTutorID: jest.fn() }));
jest.mock('../tutor/queries', () => ({
  useTutor: () => ({ isPending: false, isError: false, data: undefined }),
  useActualizarTutor: () => ({ mutate: jest.fn(), isPending: false }),
}));

const useMiTutorIDMock = useMiTutorID as jest.MockedFunction<typeof useMiTutorID>;

/**
 * "Mis datos" es la única pantalla de cuenta que tiene el tutor: es desde donde
 * sale de la sesión. Lo que se prueba es que la salida siga estando cuando la
 * ficha no se puede mostrar — si no, la cuenta queda encerrada.
 */
describe('MisDatos sin ficha de tutor', () => {
  it('ofrece cerrar sesión en vez de dejar la pantalla cargando para siempre', async () => {
    useMiTutorIDMock.mockReturnValue(undefined);

    const { getByRole, queryByText } = await render(<MisDatos />);

    expect(getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
    expect(queryByText('Mis datos')).toBeNull();
  });
});
