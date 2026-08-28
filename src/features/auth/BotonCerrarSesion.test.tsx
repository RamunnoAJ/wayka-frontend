import { fireEvent } from '@testing-library/react-native';

import { render } from '../../pruebas/render';

import { BotonCerrarSesion } from './BotonCerrarSesion';
import { useCerrarSesion } from './useCerrarSesion';

jest.mock('./useCerrarSesion', () => ({ useCerrarSesion: jest.fn() }));

const useCerrarSesionMock = useCerrarSesion as jest.MockedFunction<typeof useCerrarSesion>;

function mockearCierre({ enCurso = false } = {}) {
  const mutate = jest.fn();
  useCerrarSesionMock.mockReturnValue({ mutate, isPending: enCurso } as unknown as ReturnType<
    typeof useCerrarSesion
  >);
  return mutate;
}

/**
 * La salida de la sesión en pantalla angosta, donde no hay barra lateral que la
 * ofrezca. Lo que se prueba es que dispare el cierre una sola vez — la
 * revocación del token vive en `useCerrarSesion` y se prueba con él.
 */
describe('BotonCerrarSesion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cierra la sesión al presionarlo', async () => {
    const mutate = mockearCierre();

    const { getByRole } = await render(<BotonCerrarSesion />);
    await fireEvent.press(getByRole('button', { name: 'Cerrar sesión' }));

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  // Cerrar sesión revoca el token de refresco: un segundo disparo manda una
  // revocación con un token que ya no vale.
  it('no se dispara de nuevo mientras el cierre está en curso', async () => {
    const mutate = mockearCierre({ enCurso: true });

    const { getByRole } = await render(<BotonCerrarSesion />);
    await fireEvent.press(getByRole('button', { name: 'Cerrar sesión' }));

    expect(mutate).not.toHaveBeenCalled();
  });
});
