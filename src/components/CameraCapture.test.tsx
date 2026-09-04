import { fireEvent, waitFor } from '@testing-library/react-native';

import { render } from '../pruebas/render';

import { CameraCapture } from './CameraCapture';

/**
 * Lo que se prueba es el reparto de los controles: la fila deja a la vista solo
 * salir, disparar y abrir el resto, y lo que se plegó detrás del `···` —flash,
 * girar, galería y el modo documento, que es contrato (Alcance de Plataformas,
 * 5.6)— sigue estando. Y los estados que no son el feliz: la revisión, que no
 * ofrece disparar, y la falta de permiso, que no ofrece nada.
 */
describe('CameraCapture', () => {
  it('deja a la vista solo salir, disparar y abrir las opciones', async () => {
    const { getByLabelText, queryByLabelText } = await render(
      <CameraCapture onFlip={jest.fn()} onGallery={jest.fn()} />,
    );

    expect(getByLabelText('Cerrar la cámara')).toBeVisible();
    expect(getByLabelText('Tomar foto')).toBeVisible();
    expect(getByLabelText('Opciones de la cámara')).toBeVisible();

    expect(queryByLabelText('Flash apagado')).toBeNull();
    expect(queryByLabelText('Cambiar de cámara')).toBeNull();
    expect(queryByLabelText('Elegir de la galería')).toBeNull();
  });

  it('despliega flash, girar, galería y el cambio de modo detrás del botón de opciones', async () => {
    const { getByLabelText } = await render(
      <CameraCapture onFlip={jest.fn()} onGallery={jest.fn()} />,
    );

    await fireEvent.press(getByLabelText('Opciones de la cámara'));

    expect(getByLabelText('Flash apagado')).toBeVisible();
    expect(getByLabelText('Cambiar de cámara')).toBeVisible();
    expect(getByLabelText('Elegir de la galería')).toBeVisible();
    expect(getByLabelText('Cambiar a modo documento')).toBeVisible();
  });

  it('no ofrece cambiar de modo cuando solo hay uno', async () => {
    const { getByLabelText, queryByLabelText } = await render(<CameraCapture modes={['foto']} />);

    await fireEvent.press(getByLabelText('Opciones de la cámara'));

    expect(queryByLabelText('Cambiar a modo documento')).toBeNull();
  });

  // Las opciones abiertas sobre una toma congelada ofrecerían ajustar un
  // encuadre que ya no existe.
  it('cierra las opciones al disparar', async () => {
    const onCapture = jest.fn();
    const { getByLabelText, queryByLabelText } = await render(
      <CameraCapture onFlip={jest.fn()} onCapture={onCapture} />,
    );

    await fireEvent.press(getByLabelText('Opciones de la cámara'));
    await fireEvent.press(getByLabelText('Tomar foto'));

    expect(onCapture).toHaveBeenCalled();
    await waitFor(() => expect(queryByLabelText('Cambiar de cámara')).toBeNull());
  });

  it('en revisión ofrece repetir y usar en vez del obturador', async () => {
    const { getByText, queryByLabelText } = await render(
      <CameraCapture status="revisando" previewSrc="file:///toma.jpg" onFlip={jest.fn()} />,
    );

    expect(getByText('Repetir')).toBeVisible();
    expect(getByText('Usar')).toBeVisible();
    expect(queryByLabelText('Tomar foto')).toBeNull();
    expect(queryByLabelText('Opciones de la cámara')).toBeNull();
  });

  it('sin permiso explica la consecuencia y no ofrece disparar', async () => {
    const { getByText, getByLabelText, queryByLabelText } = await render(
      <CameraCapture status="sin-permiso" onFlip={jest.fn()} onOpenSettings={jest.fn()} />,
    );

    expect(getByText(/Sin cámara podés adjuntar fotos/)).toBeVisible();
    expect(getByText('Abrir ajustes del teléfono')).toBeVisible();
    // La salida queda: sin ella el panel no se cierra desde adentro.
    expect(getByLabelText('Cerrar la cámara')).toBeVisible();
    expect(queryByLabelText('Tomar foto')).toBeNull();
    expect(queryByLabelText('Opciones de la cámara')).toBeNull();
  });
});
