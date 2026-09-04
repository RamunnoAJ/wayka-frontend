import { confirmarCorreo } from '../../api/confirmacion';
import { ErrorApi, ErrorDeRed } from '../../lib/errores';
import { render } from '../../pruebas/render';

import { ConfirmacionDeCorreo } from './ConfirmacionDeCorreo';

jest.mock('../../api/confirmacion', () => ({ confirmarCorreo: jest.fn() }));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: () => ({ token: 'tok' }),
}));

const confirmarMock = confirmarCorreo as jest.MockedFunction<typeof confirmarCorreo>;

/**
 * La pantalla se abre desde el enlace del correo y canjea sola: llegar hasta acá
 * ya es la acción, y pedir un clic más sería un paso sin decisión.
 *
 * Lo que se prueba es que no confunda un enlace rechazado con una caída de red.
 * Decirle "tu enlace venció" a alguien que solo se quedó sin conexión lo manda a
 * rehacer algo que estaba bien.
 */
describe('ConfirmacionDeCorreo', () => {
  beforeEach(() => confirmarMock.mockReset());

  it('canja el token del enlace sin que haya que apretar nada', async () => {
    confirmarMock.mockResolvedValue(null);

    const { findByText } = await render(<ConfirmacionDeCorreo />);

    expect(await findByText(/tu correo quedó confirmado/)).toBeTruthy();
    expect(confirmarMock).toHaveBeenCalledWith('tok');
  });

  it('dice que la cuenta funcionaba igual, para que nadie crea que estaba trabada', async () => {
    confirmarMock.mockResolvedValue(null);

    const { findByText } = await render(<ConfirmacionDeCorreo />);

    expect(await findByText(/Tu cuenta ya funcionaba sin esto/)).toBeTruthy();
  });

  it('ante un enlace rechazado explica cómo conseguir otro', async () => {
    confirmarMock.mockRejectedValue(
      new ErrorApi(400, { codigo: 'datos_invalidos', mensaje: 'el enlace no es valido' }),
    );

    const { findByText, queryByText } = await render(<ConfirmacionDeCorreo />);

    expect(await findByText('Este enlace ya no sirve')).toBeTruthy();
    expect(await findByText(/pedí otro desde Ajustes/)).toBeTruthy();
    // El mensaje del backend es genérico a propósito: mostrarlo repetiría el
    // título con otras palabras, y viaja sin tildes desde el código Go.
    expect(queryByText('el enlace no es valido')).toBeNull();
  });

  it('ante una caída de red ofrece reintentar, y no culpa al enlace', async () => {
    confirmarMock.mockRejectedValue(new ErrorDeRed());

    const { findByText, queryByText } = await render(<ConfirmacionDeCorreo />);

    expect(await findByText('Algo falló en el camino')).toBeTruthy();
    expect(queryByText('Este enlace ya no sirve')).toBeNull();
  });
});
