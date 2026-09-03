import { fireEvent } from '@testing-library/react-native';

import { render } from '../../pruebas/render';

import { AltaDeMiMascota } from './AltaDeMiMascota';

/**
 * El alta de la primera mascota (Alcance de Plataformas, 5.2).
 *
 * Lo que se prueba es lo que decide esta pantalla: que el progreso reconozca el
 * registro ya hecho, y que la foto sea opcional — el alta no se traba por ella,
 * y su subida es un paso posterior que ni siquiera pasa por acá.
 */
async function alta(onGuardar = jest.fn()) {
  const vista = await render(
    <AltaDeMiMascota enviando={false} onGuardar={onGuardar} onCancelar={jest.fn()} />,
  );
  return { ...vista, onGuardar };
}

async function completarDatos(vista: Awaited<ReturnType<typeof alta>>) {
  await fireEvent.changeText(vista.getByLabelText('Nombre'), 'Luna');
  await fireEvent.changeText(vista.getByLabelText('Raza'), 'Mestiza');
  await fireEvent.changeText(vista.getByLabelText('Fecha de nacimiento'), '2020-03-15');
  await fireEvent.changeText(vista.getByLabelText('Peso'), '12,5');
}

describe('AltaDeMiMascota', () => {
  // Goal gradient: el tutor ya se registró, y una barra en cero le cobra ese
  // paso otra vez.
  it('el progreso reconoce el registro que ya está hecho', async () => {
    const vista = await alta();

    expect(vista.getByText(/Ya creaste tu cuenta/i)).toBeOnTheScreen();
  });

  // La foto es lo primero de la pantalla y no un campo más abajo del peso.
  it('ofrece la foto antes que los datos, y dice que es opcional', async () => {
    const vista = await alta();

    expect(vista.getByText('Poné su foto')).toBeOnTheScreen();
    expect(vista.getByText(/Es opcional/i)).toBeOnTheScreen();
  });

  it('sin foto el alta se envía igual', async () => {
    const vista = await alta();
    await completarDatos(vista);

    await fireEvent.press(vista.getByText('Agregar'));

    expect(vista.onGuardar).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Luna', peso_actual: 12.5 }),
      null,
    );
  });
});
