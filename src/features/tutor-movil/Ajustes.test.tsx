import { render } from '../../pruebas/render';

import { Ajustes } from './Ajustes';
import { useMiTutorID } from './queries';

jest.mock('./queries', () => ({
  useMiTutorID: jest.fn(),
  useMiFicha: () => ({ isPending: false, isError: false, data: undefined }),
}));
jest.mock('../sincronizacion', () => ({
  useGuardarFichaDelTutor: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('../notificaciones', () => ({
  HAY_PUSH: false,
  PUEDE_SIMULAR: false,
  DEMORA_DE_SIMULACION: 5,
  leerEstadoDelPermiso: jest.fn().mockResolvedValue('sin-preguntar'),
  avisosActivados: jest.fn().mockResolvedValue(false),
  activarAvisos: jest.fn(),
  desactivarAvisos: jest.fn(),
  pedirPermiso: jest.fn(),
  simularAviso: jest.fn(),
}));

const useMiTutorIDMock = useMiTutorID as jest.MockedFunction<typeof useMiTutorID>;

/**
 * Ajustes es la única pantalla de cuenta que tiene el tutor: es desde donde sale
 * de la sesión. Lo que se prueba es que la salida siga estando cuando la ficha
 * no se puede mostrar — si no, la cuenta queda encerrada en el aparato. Es el
 * caso que se rompía cuando el botón vivía adentro del bloque de la ficha, que
 * en ese estado no se dibuja.
 */
describe('Ajustes sin ficha de tutor', () => {
  it('ofrece cerrar sesión aunque la ficha no se pueda mostrar', async () => {
    useMiTutorIDMock.mockReturnValue(undefined);

    const { getByRole, getByText } = await render(<Ajustes />);

    expect(getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
    expect(getByText('Tu cuenta no tiene una ficha de tutor')).toBeTruthy();
  });

  /**
   * Los avisos dejaron de ser una pestaña y son un bloque de acá (Alcance de
   * Plataformas, 5.8): si el bloque no se monta, el tutor se queda sin ningún
   * lugar donde prenderlos o apagarlos.
   */
  it('muestra el bloque de avisos junto a la ficha', async () => {
    useMiTutorIDMock.mockReturnValue(undefined);

    const { getByText } = await render(<Ajustes />);

    expect(getByText('Avisos')).toBeTruthy();
  });
});
