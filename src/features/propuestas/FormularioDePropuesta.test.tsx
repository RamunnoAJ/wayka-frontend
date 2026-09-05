import { fireEvent } from '@testing-library/react-native';

import { render } from '../../pruebas/render';

import { DESCRIPCION_MAXIMA, FormularioDePropuesta, TITULO_MAXIMO } from './FormularioDePropuesta';

function montar(props: Partial<React.ComponentProps<typeof FormularioDePropuesta>> = {}) {
  return render(
    <FormularioDePropuesta
      enviando={false}
      onGuardar={props.onGuardar ?? jest.fn()}
      onCancelar={props.onCancelar ?? jest.fn()}
      {...props}
    />,
  );
}

describe('FormularioDePropuesta', () => {
  it('no deja publicar sin título', async () => {
    const guardar = jest.fn();
    const { findByText } = await montar({ onGuardar: guardar });

    await fireEvent.press(await findByText('Publicar'));

    expect(guardar).not.toHaveBeenCalled();
  });

  it('no deja publicar un título de menos de tres caracteres', async () => {
    const guardar = jest.fn();
    const { findByText, findByLabelText } = await montar({ onGuardar: guardar });

    await fireEvent.changeText(await findByLabelText('Qué te haría más fácil usar Wayka'), 'ok');
    await fireEvent.press(await findByText('Publicar'));

    expect(guardar).not.toHaveBeenCalled();
  });

  it('publica sin descripción: es opcional', async () => {
    const guardar = jest.fn();
    const { findByText, findByLabelText } = await montar({ onGuardar: guardar });

    await fireEvent.changeText(
      await findByLabelText('Qué te haría más fácil usar Wayka'),
      '  Exportar el historial  ',
    );
    await fireEvent.press(await findByText('Publicar'));

    // El título viaja recortado: los espacios de los costados no son título.
    expect(guardar).toHaveBeenCalledWith({
      titulo: 'Exportar el historial',
      descripcion: undefined,
    });
  });

  it('dice cuánto falta para el techo mientras se escribe', async () => {
    const { findByText, findByLabelText } = await montar();

    await fireEvent.changeText(
      await findByLabelText('Qué te haría más fácil usar Wayka'),
      'Doce chars.',
    );

    // El límite se descubre antes de escribir y no en el rechazo del backend.
    await findByText(`En una línea. 11/${TITULO_MAXIMO}`);
    await findByText(`0/${DESCRIPCION_MAXIMA}`);
  });

  it('explica el error del backend sin cerrar el formulario', async () => {
    const { findByText } = await montar({ error: 'Ya publicaste cinco propuestas hoy.' });

    await findByText('No se pudo publicar');
    await findByText('Ya publicaste cinco propuestas hoy.');
    // El formulario sigue en pantalla con lo escrito: cerrarlo tiraría el texto.
    await findByText('Publicar');
  });

  it('avisa que lo publicado no se edita ni se borra', async () => {
    const { findByText } = await montar();

    await findByText(/no se puede editar ni borrar/i);
  });
});
