import { fireEvent, waitFor } from '@testing-library/react-native';

import { cambiarContrasena } from '../../api/usuario';
import { render } from '../../pruebas/render';

import { FormularioDeContrasena } from './FormularioDeContrasena';

jest.mock('../../api/usuario', () => ({ cambiarContrasena: jest.fn() }));

const cambiar = cambiarContrasena as jest.Mock;

/**
 * Lo que se prueba son las dos reglas que la pantalla refleja y el backend
 * aplica igual: la política de contraseña (regla 2.1) y que la actual se
 * acredita **solo cuando ya hay una** — una cuenta creada con Google la
 * establece por primera vez sin acreditar nada (contrato, `cambiarContrasena`).
 *
 * Que las dos nuevas coincidan no es una regla del backend: es del formulario, y
 * por eso también se prueba acá.
 */
async function completar(
  utilidades: Awaited<ReturnType<typeof render>>,
  campos: { actual?: string; nueva: string; repetida: string },
) {
  if (campos.actual !== undefined) {
    await fireEvent.changeText(utilidades.getByLabelText('Contraseña actual'), campos.actual);
  }
  await fireEvent.changeText(utilidades.getByLabelText('Contraseña nueva'), campos.nueva);
  await fireEvent.changeText(utilidades.getByLabelText('Repetir la nueva'), campos.repetida);
}

describe('FormularioDeContrasena', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cambiar.mockResolvedValue(null);
  });

  it('manda la actual y la nueva cuando la cuenta ya tenía contraseña', async () => {
    const utilidades = await render(<FormularioDeContrasena usuarioId="u1" tieneContrasena />);

    await completar(utilidades, { actual: 'Vieja1234', nueva: 'Nueva1234', repetida: 'Nueva1234' });
    await fireEvent.press(utilidades.getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => expect(cambiar).toHaveBeenCalledTimes(1));
    expect(cambiar).toHaveBeenCalledWith('u1', {
      contrasena_actual: 'Vieja1234',
      contrasena_nueva: 'Nueva1234',
    });
  });

  // La cuenta creada con Google no tiene una anterior que acreditar: mandar el
  // campo vacío sería mandar una contraseña que el backend va a rechazar.
  it('no pide ni manda la actual cuando la cuenta todavía no tiene una', async () => {
    const utilidades = await render(
      <FormularioDeContrasena usuarioId="u1" tieneContrasena={false} />,
    );

    expect(utilidades.queryByLabelText('Contraseña actual')).toBeNull();

    await completar(utilidades, { nueva: 'Nueva1234', repetida: 'Nueva1234' });
    await fireEvent.press(utilidades.getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => expect(cambiar).toHaveBeenCalledTimes(1));
    expect(cambiar).toHaveBeenCalledWith('u1', { contrasena_nueva: 'Nueva1234' });
  });

  it('no manda una contraseña que no cumple la política', async () => {
    const utilidades = await render(<FormularioDeContrasena usuarioId="u1" tieneContrasena />);

    await completar(utilidades, { actual: 'Vieja1234', nueva: 'corta', repetida: 'corta' });
    await fireEvent.press(utilidades.getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => expect(cambiar).not.toHaveBeenCalled());
  });

  it('no manda nada si las dos nuevas no coinciden', async () => {
    const utilidades = await render(<FormularioDeContrasena usuarioId="u1" tieneContrasena />);

    await completar(utilidades, { actual: 'Vieja1234', nueva: 'Nueva1234', repetida: 'Otra12345' });
    await fireEvent.press(utilidades.getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => expect(cambiar).not.toHaveBeenCalled());
  });

  // La restricción del backend se muestra, no se descubre: mismo criterio que el
  // límite de tamaño en los adjuntos.
  it('la política está a la vista antes de escribir nada', async () => {
    const { getByText } = await render(<FormularioDeContrasena usuarioId="u1" tieneContrasena />);

    expect(getByText('Al menos 8 caracteres')).toBeVisible();
    expect(getByText('Una mayúscula')).toBeVisible();
  });

  // El clínica_admin restablece la de alguien de su plantel: no la conoce, y el
  // backend no se la pide (contrato, `cambiarContrasena`). Mandar el campo vacío
  // sería mandar una contraseña actual que va a fallar.
  it('en modo restablecer no pide ni manda la contraseña actual', async () => {
    const utilidades = await render(
      <FormularioDeContrasena usuarioId="u9" modo="restablecer" tieneContrasena />,
    );

    expect(utilidades.queryByLabelText('Contraseña actual')).toBeNull();

    await completar(utilidades, { nueva: 'Nueva1234', repetida: 'Nueva1234' });
    await fireEvent.press(utilidades.getByRole('button', { name: 'Restablecer contraseña' }));

    await waitFor(() => expect(cambiar).toHaveBeenCalledTimes(1));
    expect(cambiar).toHaveBeenCalledWith('u9', { contrasena_nueva: 'Nueva1234' });
  });

  it('el error del servidor queda a la vista', async () => {
    cambiar.mockRejectedValue(new Error('La contraseña actual no coincide'));
    const utilidades = await render(<FormularioDeContrasena usuarioId="u1" tieneContrasena />);

    await completar(utilidades, { actual: 'Mala1234', nueva: 'Nueva1234', repetida: 'Nueva1234' });
    await fireEvent.press(utilidades.getByRole('button', { name: 'Guardar contraseña' }));

    await waitFor(() => expect(utilidades.getByText('No se pudo cambiar')).toBeVisible());
  });
});
