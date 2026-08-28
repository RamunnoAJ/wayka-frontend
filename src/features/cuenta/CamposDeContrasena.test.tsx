import { fireEvent, waitFor } from '@testing-library/react-native';

import { render } from '../../pruebas/render';

import { CamposDeContrasena } from './CamposDeContrasena';

/**
 * Los campos que comparten el cambio con sesión y la recuperación por correo.
 * Lo que se prueba es la política (regla 2.1) y que las dos nuevas coincidan —
 * esto último no es del backend, es del formulario, y por eso se prueba acá.
 */
describe('CamposDeContrasena', () => {
  it('no envía una contraseña que no cumple la política', async () => {
    const onEnviar = jest.fn();
    const { getByLabelText, getByRole } = await render(<CamposDeContrasena onEnviar={onEnviar} />);

    await fireEvent.changeText(getByLabelText('Contraseña nueva'), 'corta');
    await fireEvent.changeText(getByLabelText('Repetir la nueva'), 'corta');
    await fireEvent.press(getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => expect(onEnviar).not.toHaveBeenCalled());
  });

  it('no envía nada si las dos no coinciden', async () => {
    const onEnviar = jest.fn();
    const { getByLabelText, getByRole } = await render(<CamposDeContrasena onEnviar={onEnviar} />);

    await fireEvent.changeText(getByLabelText('Contraseña nueva'), 'Nueva1234');
    await fireEvent.changeText(getByLabelText('Repetir la nueva'), 'Otra12345');
    await fireEvent.press(getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => expect(onEnviar).not.toHaveBeenCalled());
  });

  // Sin sesión no hay contraseña anterior que acreditar: la credencial es el
  // token del correo.
  it('sin pedirActual no muestra el campo de la anterior ni lo envía', async () => {
    const onEnviar = jest.fn();
    const { getByLabelText, queryByLabelText, getByRole } = await render(
      <CamposDeContrasena onEnviar={onEnviar} />,
    );

    expect(queryByLabelText('Contraseña actual')).toBeNull();

    await fireEvent.changeText(getByLabelText('Contraseña nueva'), 'Nueva1234');
    await fireEvent.changeText(getByLabelText('Repetir la nueva'), 'Nueva1234');
    await fireEvent.press(getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => expect(onEnviar).toHaveBeenCalledWith({ nueva: 'Nueva1234' }));
  });
});
