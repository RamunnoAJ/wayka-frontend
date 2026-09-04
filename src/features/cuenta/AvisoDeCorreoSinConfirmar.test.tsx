import { fireEvent, waitFor } from '@testing-library/react-native';

import { reenviarConfirmacionDeCorreo } from '../../api/confirmacion';
import { render } from '../../pruebas/render';

import { AvisoDeCorreoSinConfirmar } from './AvisoDeCorreoSinConfirmar';

jest.mock('../../api/confirmacion', () => ({
  reenviarConfirmacionDeCorreo: jest.fn(),
}));

const reenviarMock = reenviarConfirmacionDeCorreo as jest.MockedFunction<
  typeof reenviarConfirmacionDeCorreo
>;

/**
 * El aviso es el único lugar donde alguien puede arreglar un correo mal tipeado
 * antes de necesitarlo. Lo que se prueba es que no aparezca cuando no hay nada
 * que ofrecer, y que no se lea como si algo estuviera bloqueado: confirmar el
 * correo no es condición de nada (regla 4.9.1).
 */
describe('AvisoDeCorreoSinConfirmar', () => {
  beforeEach(() => {
    reenviarMock.mockReset();
    reenviarMock.mockResolvedValue(null);
  });

  it('no se dibuja cuando el correo ya está confirmado', async () => {
    const { queryByText } = await render(
      <AvisoDeCorreoSinConfirmar email="ana@ejemplo.com" confirmado />,
    );

    expect(queryByText('Confirmá tu correo')).toBeNull();
  });

  it('dice que la cuenta funciona igual, para que nadie crea que está trabada', async () => {
    const { getByText } = await render(
      <AvisoDeCorreoSinConfirmar email="ana@ejemplo.com" confirmado={false} />,
    );

    expect(getByText(/Tu cuenta funciona igual/)).toBeTruthy();
  });

  it('reenvía el enlace y avisa a qué dirección salió', async () => {
    const { getByRole, getByText } = await render(
      <AvisoDeCorreoSinConfirmar email="ana@ejemplo.com" confirmado={false} />,
    );

    fireEvent.press(getByRole('button', { name: 'Reenviar el enlace' }));

    await waitFor(() => expect(getByText(/de nuevo a ana@ejemplo.com/)).toBeTruthy());
    expect(reenviarMock).toHaveBeenCalledTimes(1);
  });

  it('avisa cuando el reenvío falla, en vez de decir que salió', async () => {
    reenviarMock.mockRejectedValue(new Error('el proveedor no contestó'));

    const { getByRole, getByText } = await render(
      <AvisoDeCorreoSinConfirmar email="ana@ejemplo.com" confirmado={false} />,
    );

    fireEvent.press(getByRole('button', { name: 'Reenviar el enlace' }));

    await waitFor(() => expect(getByText('No se pudo reenviar')).toBeTruthy());
  });
});
