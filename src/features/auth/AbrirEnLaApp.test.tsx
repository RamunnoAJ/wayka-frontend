import { fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';

import { render } from '../../pruebas/render';

import { AbrirEnLaApp } from './AbrirEnLaApp';

jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('expo-linking', () => ({
  createURL: (ruta: string, opciones: { queryParams?: Record<string, string> }) =>
    `wayka://${ruta}?token=${opciones.queryParams?.token ?? ''}`,
}));
jest.mock('../../lib/plataforma', () => ({ esWeb: true, esNativo: false, CANAL_ACTUAL: 'web' }));

const parametrosMock = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>;

/**
 * La tira ofrece la app, no obliga: la pantalla que la contiene funciona entera
 * sin ella. Lo que se prueba es quién la ve, porque eso lo decide el backend con
 * el `destino=app` del enlace (Arquitectura, 3.8) y no esta pantalla.
 */
describe('AbrirEnLaApp', () => {
  beforeEach(() => parametrosMock.mockReset());

  it('se ofrece cuando el enlace del correo la pide', async () => {
    parametrosMock.mockReturnValue({ destino: 'app', token: 'tok' });

    const { getByRole } = await render(<AbrirEnLaApp ruta="/recuperar" />);

    expect(getByRole('button', { name: 'Abrir en la app' })).toBeTruthy();
  });

  /**
   * El enlace de un clínica_admin llega sin la marca: el bloqueo de canal le
   * impide autenticarse desde móvil, así que ofrecerle la app sería mandarlo a
   * una pantalla donde no puede entrar.
   */
  it('no se dibuja sin la marca del backend', async () => {
    parametrosMock.mockReturnValue({ token: 'tok' });

    const { queryByRole } = await render(<AbrirEnLaApp ruta="/recuperar" />);

    expect(queryByRole('button', { name: 'Abrir en la app' })).toBeNull();
  });

  it('no se dibuja sin token: no habría nada que llevarle a la app', async () => {
    parametrosMock.mockReturnValue({ destino: 'app' });

    const { queryByRole } = await render(<AbrirEnLaApp ruta="/recuperar" />);

    expect(queryByRole('button', { name: 'Abrir en la app' })).toBeNull();
  });

  it('lleva el token a la ruta equivalente de la app', async () => {
    parametrosMock.mockReturnValue({ destino: 'app', token: 'tok' });
    const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    const { getByRole } = await render(<AbrirEnLaApp ruta="/recuperar" />);
    fireEvent.press(getByRole('button', { name: 'Abrir en la app' }));

    expect(abrir).toHaveBeenCalledWith('wayka:///recuperar?token=tok');
    abrir.mockRestore();
  });

  /**
   * El navegador no avisa si el esquema no está registrado. Sin esto, alguien sin
   * la app instalada se queda esperando algo que no va a pasar.
   */
  it('avisa cuando la app no se pudo abrir, en vez de dejar esperando', async () => {
    parametrosMock.mockReturnValue({ destino: 'app', token: 'tok' });
    const abrir = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValue(new Error('no hay handler para wayka://'));

    const { getByRole, findByText } = await render(<AbrirEnLaApp ruta="/recuperar" />);
    fireEvent.press(getByRole('button', { name: 'Abrir en la app' }));

    expect(await findByText(/No pudimos abrirla/)).toBeTruthy();
    abrir.mockRestore();
  });
});
