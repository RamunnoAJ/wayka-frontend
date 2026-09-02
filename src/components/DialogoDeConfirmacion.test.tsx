import { fireEvent } from '@testing-library/react-native';

import { render } from '../pruebas/render';

import { DialogoDeConfirmacion } from './DialogoDeConfirmacion';

/**
 * Lo que se prueba es el consentimiento: que confirmar sea un acto aparte, que
 * cancelar esté siempre disponible, y que un fallo se vea sin tener que cerrar
 * el diálogo.
 */
function propsBase() {
  return {
    titulo: '¿Dar de baja a Ana Rossi?',
    descripcion: 'Se desactiva también su cuenta. Lo que escribió queda con su firma.',
    etiquetaConfirmar: 'Dar de baja',
    onConfirmar: jest.fn(),
    onCancelar: jest.fn(),
  };
}

describe('DialogoDeConfirmacion', () => {
  it('no hace nada hasta que se confirma', async () => {
    const props = propsBase();
    const { getByText } = await render(<DialogoDeConfirmacion {...props} />);

    expect(props.onConfirmar).not.toHaveBeenCalled();

    await fireEvent.press(getByText('Dar de baja'));

    expect(props.onConfirmar).toHaveBeenCalledTimes(1);
  });

  it('deja salir sin hacer nada', async () => {
    const props = propsBase();
    const { getByText } = await render(<DialogoDeConfirmacion {...props} />);

    await fireEvent.press(getByText('Cancelar'));

    expect(props.onCancelar).toHaveBeenCalledTimes(1);
    expect(props.onConfirmar).not.toHaveBeenCalled();
  });

  /**
   * El error se muestra adentro: detrás del diálogo obligaría a cerrarlo para
   * leerlo, y quien cierra no se entera de que la acción falló.
   */
  it('muestra el fallo sin cerrarse', async () => {
    const props = propsBase();
    const { getByText } = await render(
      <DialogoDeConfirmacion {...props} error="Todavía tiene citas pendientes." />,
    );

    expect(getByText('Todavía tiene citas pendientes.')).toBeOnTheScreen();
    // Y las acciones siguen ahí: el reintento no obliga a volver a empezar.
    expect(getByText('Dar de baja')).toBeOnTheScreen();
  });

  /**
   * Mientras la operación corre, cancelar se bloquea: cerrar a mitad de camino
   * no la cancela en el servidor y deja la pantalla contando otra cosa.
   */
  it('no deja cancelar mientras la operación corre', async () => {
    const props = propsBase();
    const { getByText } = await render(<DialogoDeConfirmacion {...props} enviando />);

    await fireEvent.press(getByText('Cancelar'));

    expect(props.onCancelar).not.toHaveBeenCalled();
  });

  it('dice qué pasa de verdad, no solo que es irreversible', async () => {
    const props = propsBase();
    const { getByText } = await render(<DialogoDeConfirmacion {...props} />);

    expect(getByText(/Lo que escribió queda con su firma/)).toBeOnTheScreen();
  });
});
